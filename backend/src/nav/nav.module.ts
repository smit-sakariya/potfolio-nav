import { Module } from '@nestjs/common';
import { NavService } from './nav.service';
import { PortfolioModule } from '../portfolio/portfolio.module';

@Module({
  imports: [PortfolioModule], // Essential for accessing user holdings
  providers: [NavService],
})
export class NavModule {}
