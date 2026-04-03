import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Portfolio, PortfolioDocument } from '../schemas/portfolio.schema';
import { UpdateHoldingCommand } from './update-holding.command';

@CommandHandler(UpdateHoldingCommand)
export class UpdateHoldingHandler implements ICommandHandler<UpdateHoldingCommand> {
  constructor(
    @InjectModel(Portfolio.name) private portfolioModel: Model<PortfolioDocument>,
  ) {}

  async execute(command: UpdateHoldingCommand) {
    const { userId, asset, quantity, averageBuyPrice } = command;
    
    return this.portfolioModel.findOneAndUpdate(
      { userId, asset },
      { quantity, averageBuyPrice },
      { new: true, upsert: true }
    );
  }
}
