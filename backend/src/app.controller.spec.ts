import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';

describe('AppController', () => {
  let appController: AppController;
  const prismaMock = {
    $queryRaw: jest.fn(),
  };

  beforeEach(async () => {
    prismaMock.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return the API name', () => {
      expect(appController.getHello()).toBe('Real Estate API');
    });
  });

  describe('health', () => {
    it('should return health status', () => {
      expect(appController.getHealth()).toMatchObject({ status: 'ok' });
    });

    it('should return ready status when database responds', async () => {
      await expect(appController.getReady()).resolves.toMatchObject({
        status: 'ready',
        database: 'ok',
      });
    });
  });
});
