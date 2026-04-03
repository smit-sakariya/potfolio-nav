import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { RedisService } from './redis.service';

// Prevent real Redis connections during unit tests
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    set: jest.fn().mockResolvedValue('OK'),
    get: jest.fn().mockResolvedValue(null),
    keys: jest.fn().mockResolvedValue([]),
    mget: jest.fn().mockResolvedValue([]),
    disconnect: jest.fn(),
    on: jest.fn(),
  }));
});

describe('RedisService', () => {
  let service: RedisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string, defaultVal: any) => defaultVal),
          },
        },
      ],
    }).compile();

    service = module.get<RedisService>(RedisService);
    service.onModuleInit(); // Trigger the Redis client initialization
  });

  afterEach(() => {
    service.onModuleDestroy();
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('getLatestPrice() should return null when the key does not exist in cache', async () => {
    const price = await service.getLatestPrice('BTC');
    expect(price).toBeNull();
  });
});
