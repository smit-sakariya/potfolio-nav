import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Portfolio, PortfolioDocument } from './schemas/portfolio.schema';
import { NavSnapshot, NavSnapshotDocument } from './schemas/nav-snapshot.schema';

@Injectable()
export class PortfolioService {
  constructor(
    @InjectModel(Portfolio.name) private portfolioModel: Model<PortfolioDocument>,
    @InjectModel(NavSnapshot.name) private navSnapshotModel: Model<NavSnapshotDocument>,
  ) {}

  /**
   * Upserts a holding for a user.
   */
  async addHolding(userId: string, asset: string, quantity: number, averageBuyPrice: number) {
    return this.portfolioModel.findOneAndUpdate(
      { userId, asset },
      { quantity, averageBuyPrice },
      { new: true, upsert: true }
    );
  }

  /**
   * Gets all holdings for a specific user.
   */
  async getHoldings(userId: string) {
    return this.portfolioModel.find({ userId });
  }

  /**
   * CRITICAL FOR NAV ENGINE:
   * When an asset price updates, we need to know all users who hold this asset
   * so we can recalculate their NAV.
   * This uses the compound index on {asset, userId}.
   */
  async getUsersHoldingAsset(asset: string): Promise<string[]> {
    const holdings = await this.portfolioModel.find({ asset }).select('userId').lean();
    return holdings.map(h => h.userId);
  }

  /**
   * Saves a NAV snapshot for a user.
   */
  async saveNavSnapshot(userId: string, navValue: number, assetDetails?: any[]) {
    // In a real system, we might only save a snapshot if the difference is > x% to save DB size,
    // or throttle this to max 1 snapshot per minute per user.
    // For simplicity, we save it directly here.
    const snapshot = new this.navSnapshotModel({ userId, navValue, assetDetails });
    await snapshot.save();
  }

  /**
   * Retrieves NAV history for a user.
   */
  async getNavHistory(userId: string) {
    return this.navSnapshotModel.find({ userId }).sort({ timestamp: -1 }).limit(100);
  }
}
