import {Inject, Injectable, Logger} from "@nestjs/common";
import {InjectModel} from "@nestjs/mongoose";
import {Cron} from "@nestjs/schedule";
import {Model} from "mongoose";
import {ArticleService} from "@/blog/article/article.service";
import {WebsiteService} from "@/blog/website/website.service";
import {Article} from "@/schemas/article.schema";
import {Statistic} from "@/schemas/statistic.schema";
import {Website} from "@/schemas/website.schema";
import {CACHE_MANAGER} from "@nestjs/cache-manager";
import {Cache} from "cache-manager";

@Injectable()
export class AutoService {
  private readonly logger = new Logger(AutoService.name);

  constructor(
      @InjectModel("Website") private websiteModel: Model<Website>,
      @InjectModel("Article") private articleModel: Model<Article>,
      @InjectModel("Statistic") private statisticModel: Model<Statistic>,
      @Inject(CACHE_MANAGER) private cacheManager: Cache,
      private articleService: ArticleService,
      private websiteService: WebsiteService,
  ) {
  }

  // 获取所有website，分别将url传入updateArticlesByWebsite方法, 每4小时执行一次
  @Cron("0 0 0-16/4 * * *")
  async updateArticle() {
    const websites = await this.websiteModel.find().allowDiskUse(true);
    this.logger.log("Start update " + websites.length + " websites");

    // 重置缓存
    await this.cacheManager.reset();
    this.logger.log("Reset cache");

    for (const website of websites) {
      try {
        await this.articleService.updateArticlesByWebsite(website.url);
        await this.websiteService.updatePageView(website._id.toString());
      } catch (error) {
        this.logger.error(
            "Update websites failed at:" + website.url + "\n" + error.message,
        );
        await this.websiteModel.findOneAndUpdate(
            {url: website.url},
            {crawl_error: website.crawl_error + 1},
        );
      }
    }
    return this.logger.log("Auto update articles success");
  }

  // 一个月进行一次的任务。遍历所有article，一次1000篇。检测是否可访问，不可访问的会删除。
  @Cron("0 0 19 * * *")
  async checkArticles() {
    // 获取当前日期
    const currentDate = new Date();
    // 计算当前月份的第几天
    const currentDayOfMonth = currentDate.getDate();
    // 计算这个月开始检查文章的偏移量
    const offset = (currentDayOfMonth - 1) * 1000;

    // 按publish_date从旧到新排序，设置每次查询的数量为1000，并根据偏移量查询
    const articles = await this.articleModel
    .find()
    .sort({publish_date: 1})
    .limit(1000)
    .skip(offset)
    .allowDiskUse(true)
    .exec();

    this.logger.log(`Start check articles from ${offset} to ${offset + 1000}`);

    for (const article of articles) {
      try {
        const res = await fetch(article.url, {
          method: "HEAD",
          redirect: "follow",
        });
        if (!res.ok) {
          article.crawl_error += 1;
          await article.save();
          // 如果错误次数大于3次，删除文章
          if (article.crawl_error > 3) {
            await this.articleModel.findByIdAndDelete(article._id);
            this.logger.warn(
                `Delete article ${article.title} in ${article.url}`,
            );
          } else {
            this.logger.warn(
                `Failed to access ${article.url}, count: ${article.crawl_error}`,
            );
          }
        }
      } catch (error) {
        article.crawl_error += 1;
        await article.save();
        this.logger.error(
            `Failed to access ${article.url}, count: ${article.crawl_error}`,
        );
      }
    }
    await this.cacheManager.reset();
    return this.logger.log("Check articles success");
  }

  // 每天凌晨1点执行一次，计算网站和文章的数量，写入数据库
  @Cron("0 0 17 * * *")
  async updateStatistics() {
    const date = new Date();
    const websitesCount = await this.websiteModel.estimatedDocumentCount();
    const articlesCount = await this.articleModel.estimatedDocumentCount();
    const inaccessibleArticlesCount = await this.articleModel.countDocuments({
      crawl_error: {$gte: 1},
    }).exec();

    const todayStatistic = new this.statisticModel({
      date: date,
      website_count: websitesCount,
      article_count: articlesCount,
      inaccessible_article: inaccessibleArticlesCount,
    });
    await todayStatistic.save();
    await this.cacheManager.reset();
    return this.logger.log("Update statistics success");
  }
}
