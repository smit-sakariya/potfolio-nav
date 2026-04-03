import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { PortfolioService } from './portfolio.service';
import { Portfolio } from './schemas/portfolio.schema';
import { NavSnapshot } from './schemas/nav-snapshot.schema';

describe('PortfolioService', () => {
  let service: PortfolioService;

  // Minimal mock that covers the Mongoose methods used in the service
  const mockPortfolioModel = {
    findOneAndUpdate: jest.fn().mockResolvedValue({}),
    find: jest.fn().mockReturnValue({ select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) }) }),
  };
  const mockNavSnapshotModel = {
    find: jest.fn().mockReturnValue({ sort: jest.fn().mockReturnValue({ limit: jest.fn().mockResolvedValue([]) }) }),
    // Simulate `new this.navSnapshotModel(...).save()`
    prototype: { save: jest.fn().mockResolvedValue({}) },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PortfolioService,
        { provide: getModelToken(Portfolio.name), useValue: mockPortfolioModel },
        { provide: getModelToken(NavSnapshot.name), useValue: mockNavSnapshotModel },
      ],
    }).compile();

    service = module.get<PortfolioService>(PortfolioService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('getHoldings() should query the portfolio model by userId', async () => {
    mockPortfolioModel.find.mockReturnValueOnce([{ asset: 'BTC', quantity: 1 }]);
    const result = await service.getHoldings('user_123');
    expect(mockPortfolioModel.find).toHaveBeenCalledWith({ userId: 'user_123' });
    expect(result).toEqual([{ asset: 'BTC', quantity: 1 }]);
  });
});
