import { Test, TestingModule } from '@nestjs/testing';
import { LocationService } from './location.service';
import { PrismaService } from '../prisma/prisma.service';

describe('LocationService', () => {
  let service: LocationService;
  const prismaMock = {
    location: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocationService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<LocationService>(LocationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
