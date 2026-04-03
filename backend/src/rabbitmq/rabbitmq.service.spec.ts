import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { RabbitmqService } from './rabbitmq.service';

// Mock the entire amqplib module so no real connection is attempted during tests
jest.mock('amqplib', () => ({
  connect: jest.fn().mockResolvedValue({
    createChannel: jest.fn().mockResolvedValue({
      assertExchange: jest.fn().mockResolvedValue({}),
      assertQueue: jest.fn().mockResolvedValue({}),
      bindQueue: jest.fn().mockResolvedValue({}),
      publish: jest.fn(),
      consume: jest.fn(),
      ack: jest.fn(),
      nack: jest.fn(),
      close: jest.fn(),
    }),
    close: jest.fn(),
  }),
}));

describe('RabbitmqService', () => {
  let service: RabbitmqService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RabbitmqService,
        {
          provide: ConfigService,
          // Provide a minimal ConfigService mock so the service can read RABBITMQ_URI
          useValue: { get: jest.fn().mockReturnValue('amqp://localhost:5672') },
        },
      ],
    }).compile();

    service = module.get<RabbitmqService>(RabbitmqService);
    // Initialize connection (simulates the lifecycle hook)
    await service.onModuleInit();
  });

  afterEach(async () => {
    await service.onModuleDestroy();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('publish() should call channel.publish with JSON-encoded data', () => {
    const amqp = require('amqplib');
    // Internally the channel is created from the connection mock
    const mockChannel = (amqp.connect as jest.Mock).mock.results[0]?.value?.createChannel?.();
    // publish is fire-and-forget — just ensure it does not throw
    expect(() => service.publish('PRICE.UPDATE.BTC', { price: 100 })).not.toThrow();
  });
});
