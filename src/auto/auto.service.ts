import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Model } from 'mongoose';
import { ArticleService } from 'src/blog/article/article.service';
import { WebsiteService } from 'src/blog/website/website.service';
import getBaiduToken from 'src/common/get-baidu-token';
import { Website } from 'src/schemas/website.schema';

@Injectable()
export class AutoService {
  constructor(
    @InjectModel('Website') private websiteModel: Model<Website>,
    @InjectModel('Article') private articleModel: Model<Website>,
    private articleService: ArticleService,
    private websiteService: WebsiteService,
  ) { }
  private readonly logger = new Logger(AutoService.name);

  // 获取所有website，分别将url传入updateArticlesByWebsite方法, 每4小时执行一次
  @Cron('0 0 */4 * * *')
  // @Cron(CronExpression.EVERY_30_MINUTES)
  async updateArticle() {
    // 获取百度API token并传入，减少重复获取token的次数
    const token = await getBaiduToken();

    try {
      const websites = await this.websiteModel.find();
      this.logger.log('Start update ' + websites.length + ' websites')

      for (const website of websites) {
        try {
          this.logger.log('Start update articles at:' + website.url);
          await this.articleService.updateArticlesByWebsite(website.url, token);
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

  // 一个月进行一次的任务。遍历所有article，检测是否可访问，不可访问的进行标记。
  @Cron('0 0 0 2 * *')
  async checkArticles() {
    const articles = await this.articleModel.find();
    this.logger.log('Start check ' + articles.length + ' articles');

    for (const article of articles) {
      // 如果错误次数大于等于3次，删除该article
      if (article.crawl_error >= 3) {
        this.logger.warn(`Delete ${article.url} because of ${article.crawl_error} times error`);
        await this.articleModel.findByIdAndDelete(article._id);
        continue;
      }

      try {
        const res = await fetch(article.url, {
          method: 'HEAD',
          redirect: 'follow',
        });
        if (!res.ok) {
          article.crawl_error += 1;
          await article.save();
          this.logger.warn(`Failed to access ${article.url}, count: ${article.crawl_error}`);
        }
      } catch (error) {
        article.crawl_error += 1;
        await article.save();
        this.logger.warn(`Failed to access ${article.url}, count: ${article.crawl_error}`);
        continue;
      }
    }
  }
}
