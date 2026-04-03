import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

/**
 * Service to manage Redis connections and data caching.
 * Used primarily for storing the latest price of assets to compute NAV consistently.
 */
@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    // Extract connection details from environment variables
    const host = this.configService.get<string>('REDIS_HOST', 'localhost');
    const port = this.configService.get<number>('REDIS_PORT', 6379);

    // Initialize the ioredis client
    this.client = new Redis({
      host,
      port,
      retryStrategy: (times) => {
        // Simple exponential backoff retry strategy for resilience
        return Math.min(times * 50, 2000);
      },
    });

    this.client.on('error', (err) => {
      console.error('Redis client error:', err);
    });

    this.client.on('connect', () => {
      console.log(`Connected to Redis at ${host}:${port}`);
    });
  }

  onModuleDestroy() {
    this.client.disconnect();
  }

  /**
   * Saves the latest price of an asset to Redis.
   * We prefix the key with 'price:' to avoid naming collisions.
   * @param asset Asset symbol, e.g., 'BTC'
   * @param price Current price
   */
  async setLatestPrice(asset: string, price: number): Promise<void> {
    // Store price as string (Redis native format)
    await this.client.set(`price:${asset}`, price.toString());
  }

  /**
   * Retrieves the latest price for a specific asset.
   * @param asset Asset symbol
   * @returns Current price or null if not found
   */
  async getLatestPrice(asset: string): Promise<number | null> {
    const priceStr = await this.client.get(`price:${asset}`);
    if (!priceStr) return null;
    return parseFloat(priceStr);
  }

  /**
   * Retrieves all tracked prices efficiently.
   * Used when computing NAV across multiple holdings.
   * @returns A dictionary of { 'BTC': 50000, 'ETH': 3000 }
   */
  async getAllPrices(): Promise<Record<string, number>> {
    // Use 'keys' for demonstration, in production with large key sets 'scan' is better.
    // However, since active crypto tickers are limited (~10k max but usually less tracked), this is reasonable.
    const keys = await this.client.keys('price:*');
    if (keys.length === 0) return {};

    // Get all values concurrently
    const values = await this.client.mget(keys);

    const prices: Record<string, number> = {};
    for (let i = 0; i < keys.length; i++) {
        const asset = keys[i].replace('price:', '');
        prices[asset] = parseFloat(values[i] || '0');
    }

    return prices;
  }
}
