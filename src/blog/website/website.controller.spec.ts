import { Test, TestingModule } from '@nestjs/testing';
import { WebsiteController } from './website.controller';

describe('WebsiteController', () => {
  let controller: WebsiteController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WebsiteController],
    }).compile();

    controller = module.get<WebsiteController>(WebsiteController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
