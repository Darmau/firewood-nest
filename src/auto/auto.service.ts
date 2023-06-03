import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron } from '@nestjs/schedule';
import { Model } from 'mongoose';
import { ArticleService } from 'src/blog/article/article.service';
import { WebsiteService } from 'src/blog/website/website.service';
import getBaiduToken from 'src/common/get-baidu-token';
import { Article } from 'src/schemas/article.schema';
import { Statistic } from 'src/schemas/statistic.schema';
import { Website } from 'src/schemas/website.schema';

@Injectable()
export class AutoService {
  constructor(
    @InjectModel('Website') private websiteModel: Model<Website>,
    @InjectModel('Article') private articleModel: Model<Article>,
    @InjectModel('Statistic') private statisticModel: Model<Statistic>,
    private articleService: ArticleService,
    private websiteService: WebsiteService,
  ) { }
  private readonly logger = new Logger(AutoService.name);

  // 获取所有website，分别将url传入updateArticlesByWebsite方法, 每4小时执行一次
  @Cron('0 0 0-16/2 * * *')
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

  // 一个月进行一次的任务。遍历所有article，一次1000篇。检测是否可访问，不可访问的进行标记。
  @Cron('0 0 19 * * *')
  async checkArticles() {
    // 获取当前日期
    const currentDate = new Date();
    // 计算当前月份的第几天
    const currentDayOfMonth = currentDate.getDate();
    // 计算这个月开始检查文章的偏移量
    const offset = (currentDayOfMonth - 1) * 1000;

    // 按publish_date从旧到新排序，设置每次查询的数量为1000，并根据偏移量查询
    const articles = await this.articleModel.find()
      .sort({ publish_date: 1 })
      .limit(1000)
      .skip(offset);

    this.logger.log(`Start check articles from ${offset} to ${offset + 1000}`);

    for (const article of articles) {
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
        this.logger.error(`Failed to access ${article.url}, count: ${article.crawl_error}`);
        continue;
      }
    }
  }

  // 每天凌晨1点执行一次，计算网站和文章的数量，写入数据库
  @Cron('0 0 17 * * *')
  async updateStatistics() {
    const date = new Date();
    const websitesCount = await this.websiteModel.estimatedDocumentCount();
    const articlesCount = await this.articleModel.estimatedDocumentCount();
    const inaccessibleArticlesCount = await this.articleModel.countDocuments({ crawl_error: { $gte: 1 } });

    const todayStatistic = await new this.statisticModel({
      date: date,
      website_count: websitesCount,
      article_count: articlesCount,
      inaccessible_article: inaccessibleArticlesCount,
    });
    await todayStatistic.save();
    return this.logger.log('Update statistics success');
  }

  // 一次性任务。为每个website增加一个isDead字段，并设置为false
  @Cron('0 0 22 * * *')
  async addIsDead() {
    const websites = await this.websiteModel.find();
    for (const website of websites) {
      await this.websiteModel.findByIdAndUpdate(website._id, { isDead: false });
    }
    return this.logger.log('Add isDead success');
  }
}
