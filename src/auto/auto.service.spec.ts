import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AutoService } from './auto.service';
import { ArticleService } from 'src/blog/article/article.service';
import { WebsiteService } from 'src/blog/website/website.service';
import { Website } from 'src/schemas/website.schema';

describe('AutoService', () => {
  let service: AutoService;
  let websiteModel: Model<Website>;
  let articleService: ArticleService;
  let websiteService: WebsiteService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AutoService,
        ArticleService,
        WebsiteService,
        {
          provide: getModelToken('Website'),
          useValue: mockWebsiteModel,
        },
      ],
    }).compile();

    service = module.get<AutoService>(AutoService);
    websiteModel = module.get<Model<Website>>(getModelToken('Website'));
    articleService = module.get<ArticleService>(ArticleService);
    websiteService = module.get<WebsiteService>(WebsiteService);
  });

  it('should update articles and view count for each website', async () => {
    // 模拟数据库的查询
    const mockWebsites = [
      { url: 'https://www.example1.com', name: 'GeekPlux', rss: 'https://geekplux.com/cn-feed.xml' },
      { url: 'https://darmau.design', name: '可可托海没有海', rss: 'https://darmau.design/rss.xml' },,
    ] as Website[];

    jest.spyOn(websiteModel, 'find').mockResolvedValue(mockWebsites);

    // 模拟服务中调用的方法
    jest.spyOn(articleService, 'updateArticlesByWebsite').mockImplementation(url => {
      console.log('Fake update articles for:', url);
      return Promise.resolve();
    });

    jest.spyOn(websiteService, 'updatePageView').mockImplementation(url => {
      console.log('Fake update page view for:', url);
      return Promise.resolve();
    });

    // 调用测试目标的函数
    await service.excuteCron();

    expect(websiteModel.find).toHaveBeenCalledTimes(1);
    expect(articleService.updateArticlesByWebsite).toHaveBeenCalledTimes(2);
    expect(websiteService.updatePageView).toHaveBeenCalledTimes(2);
  });
});

// 模拟的websiteModel的方法
const mockWebsiteModel = {
  find: jest.fn(),
};
