import { Module } from '@nestjs/common';

/**
 * DatabaseModule is intentionally empty.
 *
 * The MongoDB connection is initialized in AppModule using MongooseModule.forRootAsync()
 * which reads MONGODB_URI from the environment via ConfigService.
 *
 * Each feature module (PortfolioModule, AlertModule) registers its own schemas via
 * MongooseModule.forFeature(). There is no global database setup needed here.
 *
 * This file is kept for structural completeness.
 */
@Module({})
export class DatabaseModule {}
