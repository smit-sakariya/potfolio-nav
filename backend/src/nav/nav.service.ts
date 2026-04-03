import { Injectable, OnModuleInit } from '@nestjs/common';
import { RabbitmqService } from '../rabbitmq/rabbitmq.service';
import { RedisService } from '../redis/redis.service';
import { PortfolioService } from '../portfolio/portfolio.service';

/**
 * NAV (Net Asset Value) Engine.
 * Responsible for recalculating a user's total portfolio value
 * whenever any of their held assets changes in price.
 */
@Injectable()
export class NavService implements OnModuleInit {
  // Tracks the last snapshot time per user to avoid saving on every price tick.
  // Key: userId, Value: timestamp of last saved snapshot (ms)
  private readonly lastSnapshotTime = new Map<string, number>();

  // Max 1 NAV snapshot saved to DB per user every 30 seconds
  // (Real-time NAV is delivered via SSE; snapshots are only for history charts)
  private readonly SNAPSHOT_INTERVAL_MS = 30_000;

  constructor(
    private readonly rabbitmqService: RabbitmqService,
    private readonly redisService: RedisService,
    private readonly portfolioService: PortfolioService,
  ) {}

  async onModuleInit() {
    // Subscribes to ANY price update event using the topic wildcard
    this.rabbitmqService.subscribe('nav_engine_queue', 'PRICE.UPDATE.*', this.handlePriceUpdate.bind(this));
  }

  /**
   * Called whenever a price ticks.
   * Note: This is a complex engineering challenge. You don't want to recompute
   * the entire platform if one asset changes. You isolate it only to affected users.
   */
  private async handlePriceUpdate(msg: any) {
    if (!msg) return;

    try {
      const payload = JSON.parse(msg.content.toString());
      const updatedAsset = payload.asset;

      // 1. Identify users actively holding this asset
      const affectedUserIds = await this.portfolioService.getUsersHoldingAsset(updatedAsset);

      if (affectedUserIds.length === 0) {
        this.rabbitmqService.ack(msg);
        return;
      }

      // 2. Fetch the holistic latest state from Redis to ensure consistency.
      // E.g., if a user holds BTC and ETH, and BTC updates, we need the latest ETH price too.
      const currentPrices = await this.redisService.getAllPrices();

      // 3. Recalculate NAV for each affected user
      // For large user bases, we would chunk these processing promises
      const calculatePromises = affectedUserIds.map(userId => 
        this.recalculateUserNav(userId, currentPrices)
      );
      
      await Promise.all(calculatePromises);

      // Acknowledge the message so it's removed from the queue
      this.rabbitmqService.ack(msg);
    } catch (error) {
      console.error('NAV Engine Error:', error);
      // Nack message on failure to trigger a potential requeue
      this.rabbitmqService.nack(msg);
    }
  }

  /**
   * Recalculates exact NAV based on current holdings and live Redis prices.
   */
  private async recalculateUserNav(userId: string, currentPrices: Record<string, number>) {
    // Fetch all user holdings from DB
    const holdings = await this.portfolioService.getHoldings(userId);

    let nav = 0;
    const calculationMath: string[] = [];
    const assetDetails: any[] = [];

    for (const holding of holdings) {
      const livePrice = currentPrices[holding.asset] || 0;
      const total = holding.quantity * livePrice;
      nav += total;
      calculationMath.push(`${holding.quantity} ${holding.asset} @ $${livePrice}`);
      
      assetDetails.push({
        asset: holding.asset,
        quantity: holding.quantity,
        price: livePrice,
        total: total
      });
    }

    // Log a clear, readable NAV recalculation summary for observability
    console.log(`[NAV Engine] User: ${userId} | New NAV: $${nav.toFixed(2)} | Formula: ${calculationMath.join(' + ')}`);

    // Save a NAV snapshot at most once every 30 seconds per user to avoid write spam.
    // Clients get real-time NAV through SSE; snapshots are only for historical charting.
    const now = Date.now();
    const lastSaved = this.lastSnapshotTime.get(userId) || 0;
    if (now - lastSaved >= this.SNAPSHOT_INTERVAL_MS) {
      await this.portfolioService.saveNavSnapshot(userId, nav, assetDetails);
      this.lastSnapshotTime.set(userId, now);
    }

    // Publish NAV_UPDATED event for Alerts Engine and SSE Module
    this.rabbitmqService.publish('NAV.UPDATED', {
      userId,
      navValue: nav,
      timestamp: Date.now()
    });
  }
}
