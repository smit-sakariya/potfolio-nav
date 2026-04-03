import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CqrsModule } from '@nestjs/cqrs';
import { Portfolio, PortfolioSchema } from './schemas/portfolio.schema';
import { NavSnapshot, NavSnapshotSchema } from './schemas/nav-snapshot.schema';
import { PortfolioController } from './portfolio.controller';
import { PortfolioService } from './portfolio.service';

import { UpdateHoldingHandler } from './commands/update-holding.handler';
import { GetHoldingsHandler } from './queries/get-holdings.handler';
import { GetNavHandler } from './queries/get-nav.handler';
import { GetNavHistoryHandler } from './queries/get-nav-history.handler';

const CommandHandlers = [UpdateHoldingHandler];
const QueryHandlers = [GetHoldingsHandler, GetNavHandler, GetNavHistoryHandler];

@Module({
  imports: [
    CqrsModule,
    MongooseModule.forFeature([
      { name: Portfolio.name, schema: PortfolioSchema },
      { name: NavSnapshot.name, schema: NavSnapshotSchema },
    ]),
  ],
  controllers: [PortfolioController],
  providers: [
    PortfolioService, // Still exposed for internal modules like NAV Engine
    ...CommandHandlers,
    ...QueryHandlers
  ],
  exports: [PortfolioService],
})
export class PortfolioModule {}
