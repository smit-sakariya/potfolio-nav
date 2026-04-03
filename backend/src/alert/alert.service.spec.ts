import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { AlertService } from './alert.service';
import { Alert } from './schemas/alert.schema';
import { RabbitmqService } from '../rabbitmq/rabbitmq.service';

describe('AlertService', () => {
  let service: AlertService;

  const mockAlertModel = {
    // Each mocked function returns a jest.fn() so tests can inspect calls
    find: jest.fn().mockReturnValue({ sort: jest.fn().mockResolvedValue([]) }),
    findByIdAndUpdate: jest.fn().mockResolvedValue({}),
    updateMany: jest.fn().mockResolvedValue({}),
    // Simulate constructor pattern used by `new this.alertModel()`
    prototype: { save: jest.fn().mockResolvedValue({}) },
  };

  const mockRabbitmqService = {
    subscribe: jest.fn(),
    publish: jest.fn(),
    ack: jest.fn(),
    nack: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlertService,
        { provide: getModelToken(Alert.name), useValue: mockAlertModel },
        { provide: RabbitmqService, useValue: mockRabbitmqService },
      ],
    }).compile();

    service = module.get<AlertService>(AlertService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('onModuleInit() should subscribe to both PRICE.UPDATE.* and NAV.UPDATED queues', async () => {
    await service.onModuleInit();
    expect(mockRabbitmqService.subscribe).toHaveBeenCalledTimes(2);
    expect(mockRabbitmqService.subscribe).toHaveBeenCalledWith(
      'alert_engine_price_queue',
      'PRICE.UPDATE.*',
      expect.any(Function),
    );
    expect(mockRabbitmqService.subscribe).toHaveBeenCalledWith(
      'alert_engine_nav_queue',
      'NAV.UPDATED',
      expect.any(Function),
    );
  });
});
