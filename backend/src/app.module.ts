import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RedisModule } from './redis/redis.module';
import { RabbitmqModule } from './rabbitmq/rabbitmq.module';
import { PortfolioModule } from './portfolio/portfolio.module';
import { AlertModule } from './alert/alert.module';
import { IngestionModule } from './ingestion/ingestion.module';
import { NavModule } from './nav/nav.module';
import { SseModule } from './sse/sse.module';

@Module({
  imports: [
    // 1. Initialize Configuration Module globally
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    // 2. Initialize MongoDB connection
    // We use MongooseModule.forRootAsync to inject ConfigService and get MONGODB_URI safely
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
    }),
    // 3. Feature Modules
    RedisModule,
    RabbitmqModule,
    PortfolioModule,
    AlertModule,
    IngestionModule,
    NavModule,
    SseModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
