import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PortfolioDocument = Portfolio & Document;

@Schema({ timestamps: true }) // Automatically adds createdAt and updatedAt
export class Portfolio {
  @Prop({ required: true, index: true })
  userId: string; // The owner of the portfolio

  @Prop({ required: true })
  asset: string; // E.g., 'BTC', 'ETH'

  @Prop({ required: true, default: 0 })
  quantity: number; // Amount held

  @Prop({ required: true, default: 0 })
  averageBuyPrice: number; // To track profit/loss, though not strictly required for NAV
}

export const PortfolioSchema = SchemaFactory.createForClass(Portfolio);

// Compound index to ensure a user only has one entry per asset
PortfolioSchema.index({ userId: 1, asset: 1 }, { unique: true });
