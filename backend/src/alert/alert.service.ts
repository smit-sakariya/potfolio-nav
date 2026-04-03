import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RabbitmqService } from '../rabbitmq/rabbitmq.service';
import { Alert, AlertDocument, AlertDirection, AlertStatus } from './schemas/alert.schema';

@Injectable()
export class AlertService implements OnModuleInit {
  constructor(
    @InjectModel(Alert.name) private alertModel: Model<AlertDocument>,
    private readonly rabbitmqService: RabbitmqService
  ) {}

  async onModuleInit() {
    // We subscribe exclusively to NAV.UPDATED events so alerts fire
    // when a user's *total portfolio value* crosses their threshold.
    this.rabbitmqService.subscribe('alert_engine_nav_queue', 'NAV.UPDATED', this.handleNavUpdate.bind(this));
  }

  // ==== API Methods ====

  /**
   * Creates a NAV-level alert for a user.
   * Alerts fire when the user's total portfolio NAV crosses the threshold.
   * The asset is always 'NAV' — we are not watching individual token prices.
   */
  async createAlert(userId: string, thresholdPrice: number, direction: AlertDirection) {
    const alert = new this.alertModel({
      userId,
      asset: 'NAV',           // Always 'NAV' — this is a portfolio-level alert
      thresholdPrice,
      direction,
      status: AlertStatus.ACTIVE
    });
    return alert.save();
  }

  async getAlerts(userId: string) {
    return this.alertModel.find({ userId }).sort({ createdAt: -1 });
  }

  async resetAlert(alertId: string) {
    return this.alertModel.findByIdAndUpdate(alertId, { status: AlertStatus.ACTIVE, triggeredAt: null }, { new: true });
  }

  // ==== Engine Logic ====

  private async handleNavUpdate(msg: any) {
    if (!msg) return;
    try {
      const payload = JSON.parse(msg.content.toString());
      // Evaluate only this user's NAV-based alerts
      await this.evaluateAlerts('NAV', payload.navValue, payload.userId);
      this.rabbitmqService.ack(msg);
    } catch (e) {
      console.error('Alert Engine: failed to process NAV update', e);
      this.rabbitmqService.nack(msg);
    }
  }

  /**
   * The core deduplication and crossing logic.
   * Atomically finds and updates active alerts that crossed the threshold.
   */
  private async evaluateAlerts(asset: string, currentValue: number, specificUserId?: string) {
    const query: any = {
      asset,
      status: AlertStatus.ACTIVE,
      $or: [
        { direction: AlertDirection.ABOVE, thresholdPrice: { $lte: currentValue } },
        { direction: AlertDirection.BELOW, thresholdPrice: { $gte: currentValue } }
      ]
    };

    if (specificUserId) {
       query.userId = specificUserId;
    }

    // Fetch all active alerts whose threshold has been crossed
    const triggeredAlerts = await this.alertModel.find(query);
    if (triggeredAlerts.length === 0) return;

    // Atomic update: mark all matching alerts as TRIGGERED in one DB call
    const ids = triggeredAlerts.map((a: AlertDocument) => a._id);
    await this.alertModel.updateMany(
       { _id: { $in: ids } },
       { $set: { status: AlertStatus.TRIGGERED, triggeredAt: new Date() } }
    );

    // Group alerts by userId and emit ONE event per user.
    // Without grouping, if a user has 4 active alerts that all cross the threshold
    // simultaneously, 4 separate ALERT.TRIGGERED events would fire — causing 4
    // notification toasts on the frontend for a single price movement.
    const byUser = new Map<string, AlertDocument[]>();
    for (const alert of triggeredAlerts) {
      const uid = String(alert.userId);
      if (!byUser.has(uid)) byUser.set(uid, []);
      byUser.get(uid)!.push(alert);
    }

    for (const [userId, userAlerts] of byUser) {
      const eventPayload = {
        userId,
        // All alerts that fired in this tick for this user
        triggeredAlerts: userAlerts.map((a: AlertDocument) => ({
          alertId: a._id,
          threshold: a.thresholdPrice,
          direction: a.direction,
        })),
        currentNavValue: currentValue,
        timestamp: Date.now(),
      };
      this.rabbitmqService.publish('ALERT.TRIGGERED', eventPayload);
      console.log(`Alert Engine: Fired ${userAlerts.length} alert(s) for User ${userId} — NAV $${currentValue}`);
    }
  }
}
