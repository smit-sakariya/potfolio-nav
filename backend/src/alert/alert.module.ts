import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CqrsModule } from '@nestjs/cqrs';
import { Alert, AlertSchema } from './schemas/alert.schema';
import { AlertController } from './alert.controller';
import { AlertService } from './alert.service';

import { CreateAlertHandler } from './commands/create-alert.handler';
import { ResetAlertHandler } from './commands/reset-alert.handler';
import { GetAlertsHandler } from './queries/get-alerts.handler';

const CommandHandlers = [CreateAlertHandler, ResetAlertHandler];
const QueryHandlers = [GetAlertsHandler];

@Module({
  imports: [
    CqrsModule,
    MongooseModule.forFeature([{ name: Alert.name, schema: AlertSchema }]),
  ],
  controllers: [AlertController],
  providers: [
    AlertService, // Original domain service used by the background Event Processors
    ...CommandHandlers,
    ...QueryHandlers,
  ],
  exports: [AlertService],
})
export class AlertModule {}
