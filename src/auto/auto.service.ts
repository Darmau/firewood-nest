import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Model } from 'mongoose';
import { ArticleService } from 'src/blog/article/article.service';
import { WebsiteService } from 'src/blog/website/website.service';
import { Website } from 'src/schemas/website.schema';

@Injectable()
export class AutoService {
  constructor(
    @InjectModel('Website') private websiteModel: Model<Website>,
    private articleService: ArticleService,
    private websiteService: WebsiteService,
  ) { }
  private readonly logger = new Logger(AutoService.name);

  // 获取所有website，分别将url传入updateArticlesByWebsite方法, 每2小时执行一次
  // @Cron('0 0 */2 * * *')
  @Cron(CronExpression.EVERY_30_MINUTES)
  async excuteCron() {
    try {
      const websites = await this.websiteModel.find();
      this.logger.log('Start update ' + websites.length + ' websites')
      for (const website of websites) {
        try {
          this.logger.log('Start update articles at:' + website.url);
          await this.articleService.updateArticlesByWebsite(website.url);
          await this.websiteService.updatePageView(website.url);
        } catch (error) {
          this.logger.error('Update websites failed at:' + website.url + '\n' + error.message);
          await this.websiteModel.findOneAndUpdate({ url: website.url }, { crawl_error: website.crawl_error + 1 });
          continue;
        }
      }
      return this.logger.log('Auto update articles success');
    } catch (error) {
      this.logger.error('Auto update articles failed:' + error.message);
    }
  }
}
