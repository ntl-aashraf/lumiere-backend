import { Test, TestingModule } from '@nestjs/testing';
import { WatchLaterController } from './watch-later.controller';
import { WatchLaterService } from './watch-later.service';

describe('WatchLaterController', () => {
  let controller: WatchLaterController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WatchLaterController],
      providers: [WatchLaterService],
    }).compile();

    controller = module.get<WatchLaterController>(WatchLaterController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
