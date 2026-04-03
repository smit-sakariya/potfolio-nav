import { Test, TestingModule } from '@nestjs/testing';
import { SseService } from './sse.service';
import { RabbitmqService } from '../rabbitmq/rabbitmq.service';

describe('SseService', () => {
  let service: SseService;

  const mockRabbitmqService = {
    subscribe: jest.fn(),
    ack: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SseService,
        { provide: RabbitmqService, useValue: mockRabbitmqService },
      ],
    }).compile();

    service = module.get<SseService>(SseService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('onModuleInit() should subscribe to NAV.UPDATED and ALERT.TRIGGERED', async () => {
    await service.onModuleInit();
    expect(mockRabbitmqService.subscribe).toHaveBeenCalledTimes(2);
    expect(mockRabbitmqService.subscribe).toHaveBeenCalledWith(
      'sse_nav_updates',
      'NAV.UPDATED',
      expect.any(Function),
    );
    expect(mockRabbitmqService.subscribe).toHaveBeenCalledWith(
      'sse_alert_updates',
      'ALERT.TRIGGERED',
      expect.any(Function),
    );
  });
});
