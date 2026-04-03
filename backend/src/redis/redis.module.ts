import { Global, Module } from '@nestjs/common';
import { RedisService } from './redis.service';

@Global() // Make it global so other modules don't need to import RedisModule repeatedly
@Module({
  providers: [RedisService],
  exports: [RedisService], // Export it
})
export class RedisModule {}
