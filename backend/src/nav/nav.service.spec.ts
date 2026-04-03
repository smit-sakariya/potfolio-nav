import { Test, TestingModule } from '@nestjs/testing';
import { NavService } from './nav.service';
import { RabbitmqService } from '../rabbitmq/rabbitmq.service';
import { RedisService } from '../redis/redis.service';
import { PortfolioService } from '../portfolio/portfolio.service';

describe('NavService', () => {
  let service: NavService;

  // Mocks return controlled data so tests are deterministic and self-contained
  const mockRabbitmqService = {
    subscribe: jest.fn(),
    publish: jest.fn().mockResolvedValue(undefined),
    ack: jest.fn(),
    nack: jest.fn(),
  };
  const mockRedisService = {
    getAllPrices: jest.fn().mockResolvedValue({ BTC: 50000 }),
  };
  const mockPortfolioService = {
    getUsersHoldingAsset: jest.fn().mockResolvedValue(['user_123']),
    getHoldings: jest.fn().mockResolvedValue([{ asset: 'BTC', quantity: 2 }]),
    saveNavSnapshot: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NavService,
        { provide: RabbitmqService, useValue: mockRabbitmqService },
        { provide: RedisService, useValue: mockRedisService },
        { provide: PortfolioService, useValue: mockPortfolioService },
      ],
    }).compile();

    service = module.get<NavService>(NavService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('onModuleInit() should subscribe to PRICE.UPDATE.* on the nav_engine_queue', async () => {
    await service.onModuleInit();
    expect(mockRabbitmqService.subscribe).toHaveBeenCalledWith(
      'nav_engine_queue',
      'PRICE.UPDATE.*',
      expect.any(Function),
    );
  });
});
