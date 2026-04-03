import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type NavSnapshotDocument = NavSnapshot & Document;

/**
 * Stores historical snapshots of a user's Portfolio NAV.
 * Used to chart the NAV over time.
 */
@Schema({ timestamps: true })
export class NavSnapshot {
  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true })
  navValue: number;

  @Prop({ required: false, type: [Object] })
  assetDetails?: { asset: string; quantity: number; price: number; total: number }[];

  @Prop({ required: true, default: Date.now, index: true })
  timestamp: Date;
}

export const NavSnapshotSchema = SchemaFactory.createForClass(NavSnapshot);
