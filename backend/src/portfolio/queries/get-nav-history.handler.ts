import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NavSnapshot, NavSnapshotDocument } from '../schemas/nav-snapshot.schema';
import { GetNavHistoryQuery } from './get-nav-history.query';

@QueryHandler(GetNavHistoryQuery)
export class GetNavHistoryHandler implements IQueryHandler<GetNavHistoryQuery> {
  constructor(
    @InjectModel(NavSnapshot.name) private navSnapshotModel: Model<NavSnapshotDocument>,
  ) {}

  async execute(query: GetNavHistoryQuery) {
    return this.navSnapshotModel.find({ userId: query.userId }).sort({ timestamp: -1 }).limit(100);
  }
}
