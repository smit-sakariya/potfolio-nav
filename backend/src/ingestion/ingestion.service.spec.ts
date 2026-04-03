import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { IngestionService } from './ingestion.service';
import { RedisService } from '../redis/redis.service';
import { RabbitmqService } from '../rabbitmq/rabbitmq.service';

// Prevent real WebSocket connections during unit tests
jest.mock('ws');
jest.mock('axios');

describe('IngestionService', () => {
  let service: IngestionService;

  const mockRedisService = { setLatestPrice: jest.fn().mockResolvedValue(undefined) };
  const mockRabbitmqService = { publish: jest.fn().mockResolvedValue(undefined) };
  const mockConfigService = { get: jest.fn().mockReturnValue(undefined) };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IngestionService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: RedisService, useValue: mockRedisService },
        { provide: RabbitmqService, useValue: mockRabbitmqService },
      ],
    }).compile();

    service = module.get<IngestionService>(IngestionService);
  });

  afterEach(() => {
    // Clean up timers / WebSocket etc.
    service.onModuleDestroy();
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
