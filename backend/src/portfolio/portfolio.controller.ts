import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { UpdateHoldingCommand } from './commands/update-holding.command';
import { GetHoldingsQuery } from './queries/get-holdings.query';
import { GetNavQuery } from './queries/get-nav.query';
import { GetNavHistoryQuery } from './queries/get-nav-history.query';

class AddHoldingDto {
  userId: string;
  asset: string;
  quantity: number;
  averageBuyPrice: number;
}

@Controller('portfolio')
export class PortfolioController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus
  ) {}

  @Post('holdings')
  async addHolding(@Body() body: AddHoldingDto) {
    return this.commandBus.execute(
      new UpdateHoldingCommand(body.userId, body.asset, body.quantity, body.averageBuyPrice)
    );
  }

  @Get('holdings/:userId')
  async getHoldings(@Param('userId') userId: string) {
    return this.queryBus.execute(new GetHoldingsQuery(userId));
  }

  /**
   * Calculates the current NAV instantly on-demand using current holdings and Redis.
   * Dispatched natively via CQRS Query bus avoiding service coupling.
   */
  @Get('nav/:userId')
  async getCurrentNav(@Param('userId') userId: string) {
    return this.queryBus.execute(new GetNavQuery(userId));
  }

  @Get('nav/:userId/history')
  async getNavHistory(@Param('userId') userId: string) {
    return this.queryBus.execute(new GetNavHistoryQuery(userId));
  }
}
