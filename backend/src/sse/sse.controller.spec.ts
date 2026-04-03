import { Test, TestingModule } from '@nestjs/testing';
import { SseController } from './sse.controller';
import { SseService } from './sse.service';

describe('SseController', () => {
  let controller: SseController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SseController],
      providers: [
        // SseController depends on SseService — provide a minimal mock
        { provide: SseService, useValue: { subscribeToUserEvents: jest.fn() } },
      ],
    }).compile();

    controller = module.get<SseController>(SseController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
