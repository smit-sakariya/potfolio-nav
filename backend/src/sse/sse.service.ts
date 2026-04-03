import { Injectable, OnModuleInit } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';
import { RabbitmqService } from '../rabbitmq/rabbitmq.service';

/**
 * Server-Sent Events Service.
 * Acts as a bridge between internal RabbitMQ events and the external SSE streams.
 */
@Injectable()
export class SseService implements OnModuleInit {
  // We use RxJS Subjects which are perfectly suited for SSE streams in NestJS
  private readonly eventsSubject = new Subject<any>();

  constructor(private readonly rabbitmqService: RabbitmqService) {}

  async onModuleInit() {
    // 1. Listen for new NAV computations
    this.rabbitmqService.subscribe('sse_nav_updates', 'NAV.UPDATED', (msg) => {
      if (msg) {
        const payload = JSON.parse(msg.content.toString());
        // Push the event into the RxJS stream
        this.eventsSubject.next({ type: 'NAV_UPDATE', data: payload });
        this.rabbitmqService.ack(msg);
      }
    });

    // 2. Listen for triggered alerts
    this.rabbitmqService.subscribe('sse_alert_updates', 'ALERT.TRIGGERED', (msg) => {
      if (msg) {
        const payload = JSON.parse(msg.content.toString());
        this.eventsSubject.next({ type: 'ALERT_TRIGGERED', data: payload });
        this.rabbitmqService.ack(msg);
      }
    });
  }

  /**
   * Returns an observable stream for a specific user.
   * Filters the global event stream so users only see their own data.
   */
  subscribeToUserEvents(userId: string): Observable<any> {
    return new Observable((subscriber) => {
      const subscription = this.eventsSubject.subscribe((event) => {
        // Only forward events belonging to this specific user
        if (event.data.userId === userId) {
          subscriber.next({ data: event });
        }
      });

      // Cleanup when client disconnects
      return () => {
        subscription.unsubscribe();
      };
    });
  }
}
