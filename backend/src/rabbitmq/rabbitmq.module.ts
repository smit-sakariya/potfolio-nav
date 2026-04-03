import { Global, Module } from '@nestjs/common';
import { RabbitmqService } from './rabbitmq.service';

@Global() // Make it global so services like Ingestion and Nav don't need to import it explicitly
@Module({
  providers: [RabbitmqService],
  exports: [RabbitmqService],
})
export class RabbitmqModule {}
