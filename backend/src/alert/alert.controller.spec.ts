import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { AlertController } from './alert.controller';

describe('AlertController', () => {
  let controller: AlertController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AlertController],
      providers: [
        // AlertController uses CommandBus and QueryBus — provide minimal mocks
        { provide: CommandBus, useValue: { execute: jest.fn() } },
        { provide: QueryBus, useValue: { execute: jest.fn() } },
      ],
    }).compile();

    controller = module.get<AlertController>(AlertController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
