import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Alert, AlertDocument } from '../schemas/alert.schema';
import { GetAlertsQuery } from './get-alerts.query';

@QueryHandler(GetAlertsQuery)
export class GetAlertsHandler implements IQueryHandler<GetAlertsQuery> {
  constructor(
    @InjectModel(Alert.name) private alertModel: Model<AlertDocument>,
  ) {}

  async execute(query: GetAlertsQuery) {
    return this.alertModel.find({ userId: query.userId }).sort({ createdAt: -1 });
  }
}
