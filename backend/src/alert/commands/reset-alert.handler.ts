import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Alert, AlertDocument, AlertStatus } from '../schemas/alert.schema';
import { ResetAlertCommand } from './reset-alert.command';

@CommandHandler(ResetAlertCommand)
export class ResetAlertHandler implements ICommandHandler<ResetAlertCommand> {
  constructor(
    @InjectModel(Alert.name) private alertModel: Model<AlertDocument>,
  ) {}

  async execute(command: ResetAlertCommand) {
    return this.alertModel.findByIdAndUpdate(
      command.alertId,
      { status: AlertStatus.ACTIVE },
      { new: true }
    );
  }
}
