import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { AlertDirection } from './schemas/alert.schema';
import { CreateAlertCommand } from './commands/create-alert.command';
import { ResetAlertCommand } from './commands/reset-alert.command';
import { GetAlertsQuery } from './queries/get-alerts.query';

class CreateAlertDto {
  userId: string;
  thresholdPrice: number;
  direction: AlertDirection;
}

@Controller('alert')
export class AlertController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  async createAlert(@Body() body: CreateAlertDto) {
    return this.commandBus.execute(
      new CreateAlertCommand(body.userId, body.thresholdPrice, body.direction)
    );
  }

  @Get(':userId')
  async getAlerts(@Param('userId') userId: string) {
    return this.queryBus.execute(new GetAlertsQuery(userId));
  }

  // Resets a triggered alert back to ACTIVE
  @Post(':alertId/reset')
  async resetAlert(@Param('alertId') alertId: string) {
    return this.commandBus.execute(new ResetAlertCommand(alertId));
  }
}
