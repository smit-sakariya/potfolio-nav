import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Portfolio, PortfolioDocument } from '../schemas/portfolio.schema';
import { GetHoldingsQuery } from './get-holdings.query';

@QueryHandler(GetHoldingsQuery)
export class GetHoldingsHandler implements IQueryHandler<GetHoldingsQuery> {
  constructor(
    @InjectModel(Portfolio.name) private portfolioModel: Model<PortfolioDocument>,
  ) {}

  async execute(query: GetHoldingsQuery) {
    return this.portfolioModel.find({ userId: query.userId });
  }
}
