import { Controller, Sse, Param } from '@nestjs/common';
import { Observable } from 'rxjs';
import { SseService } from './sse.service';

interface MessageEvent {
  data: string | object;
  id?: string;
  type?: string;
  retry?: number;
}

@Controller('stream')
export class SseController {
  constructor(private readonly sseService: SseService) {}

  /**
   * The @Sse() decorator explicitly tells NestJS to hold the connection open
   * and stream responses using text/event-stream content type.
   * Clients connect to: `GET /stream/user_123`
   */
  @Sse(':userId')
  streamEvents(@Param('userId') userId: string): Observable<MessageEvent> {
    return this.sseService.subscribeToUserEvents(userId);
  }
}
