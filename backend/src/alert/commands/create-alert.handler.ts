import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Alert, AlertDocument, AlertStatus } from '../schemas/alert.schema';
import { CreateAlertCommand } from './create-alert.command';

@CommandHandler(CreateAlertCommand)
export class CreateAlertHandler implements ICommandHandler<CreateAlertCommand> {
  constructor(
    @InjectModel(Alert.name) private alertModel: Model<AlertDocument>,
  ) {}

  async execute(command: CreateAlertCommand) {
    const { userId, thresholdPrice, direction } = command;
    const alert = new this.alertModel({
      userId,
      asset: 'NAV',   // Portfolio-level alert — always 'NAV'
      thresholdPrice,
      direction,
      status: AlertStatus.ACTIVE,
    });
    return alert.save();
  }
}
