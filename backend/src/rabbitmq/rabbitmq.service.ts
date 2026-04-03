import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';

@Injectable()
export class RabbitmqService implements OnModuleInit, OnModuleDestroy {
  private connection: any;
  private channel: any;
  private destroyed = false;
  // Tracks which queues already have an active consumer in this process.
  // Prevents adding duplicate consumers if subscribe() is called more than once.
  private readonly activeConsumers = new Set<string>();

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    this.destroyed = true; // Signal to the retry loop that we're shutting down
    await this.channel?.close();
    await this.connection?.close();
  }

  private async connect() {
    const uri = this.configService.get<string>('RABBITMQ_URI', 'amqp://localhost:5672');
    
    try {
      this.connection = await amqp.connect(uri);
      this.channel = await this.connection.createChannel();
      
      console.log(`Connected to RabbitMQ at ${uri}`);
      await this.channel.assertExchange('portfolio_events', 'topic', { durable: true });
      // Ensure only one unacknowledged message is in-flight per channel.
      // This prevents RabbitMQ from flooding a consumer with burst messages.
      await this.channel.prefetch(1);
    } catch (error) {
      console.error('Failed to connect to RabbitMQ, retrying in 5 seconds...', error);
      // Only retry if the module has not been shut down
      if (!this.destroyed) {
        setTimeout(() => this.connect(), 5000);
      }
    }
  }

  async publish(routingKey: string, data: any): Promise<void> {
    if (!this.channel) return;
    this.channel.publish(
      'portfolio_events', 
      routingKey, 
      Buffer.from(JSON.stringify(data)),
      { persistent: true } 
    );
  }

  async subscribe(
    queueName: string,
    routingKey: string,
    handler: (msg: any) => void
  ): Promise<void> {
    if (!this.channel) throw new Error('RabbitMQ channel not initialized');

    await this.channel.assertQueue(queueName, { durable: true });
    await this.channel.bindQueue(queueName, 'portfolio_events', routingKey);

    // Guard: only register one consumer per queue per process lifetime.
    // Without this, calling subscribe() twice (e.g. on reconnect) would create
    // two consumers on the same durable queue, causing every message to be
    // processed twice.
    if (!this.activeConsumers.has(queueName)) {
      this.activeConsumers.add(queueName);
      this.channel.consume(queueName, handler, { noAck: false });
    }
  }

  ack(msg: any) {
    this.channel?.ack(msg);
  }

  nack(msg: any) {
    this.channel?.nack(msg);
  }
}
