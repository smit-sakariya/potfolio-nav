import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AlertDocument = Alert & Document;

export enum AlertDirection {
  ABOVE = 'ABOVE',
  BELOW = 'BELOW',
}

export enum AlertStatus {
  ACTIVE = 'ACTIVE',     // Waiting to be triggered
  TRIGGERED = 'TRIGGERED' // Already fired, prevents duplicate triggers
}

/**
 * Stores user-defined threshold alerts.
 */
@Schema({ timestamps: true })
export class Alert {
  @Prop({ required: true, index: true })
  userId: string;

  // The asset to monitor ('BTC', 'ETH') or 'NAV' for overall portfolio
  @Prop({ required: true, index: true })
  asset: string;

  @Prop({ required: true })
  thresholdPrice: number;

  @Prop({ required: true, enum: AlertDirection })
  direction: AlertDirection;

  @Prop({ required: true, enum: AlertStatus, default: AlertStatus.ACTIVE })
  status: AlertStatus;

  @Prop({ type: Date })
  triggeredAt?: Date;
}

export const AlertSchema = SchemaFactory.createForClass(Alert);
