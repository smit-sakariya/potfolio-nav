import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Portfolio, PortfolioDocument } from '../schemas/portfolio.schema';
import { GetNavQuery } from './get-nav.query';
import { RedisService } from '../../redis/redis.service';

@QueryHandler(GetNavQuery)
export class GetNavHandler implements IQueryHandler<GetNavQuery> {
  constructor(
    @InjectModel(Portfolio.name) private portfolioModel: Model<PortfolioDocument>,
    private readonly redisService: RedisService,
  ) {}

  async execute(query: GetNavQuery) {
    const holdings = await this.portfolioModel.find({ userId: query.userId });
    const prices = await this.redisService.getAllPrices();
    
    let currentNav = 0;
    for (const h of holdings) {
      currentNav += (h.quantity * (prices[h.asset] || 0));
    }

    return { userId: query.userId, currentNav, timestamp: Date.now() };
  }
}
