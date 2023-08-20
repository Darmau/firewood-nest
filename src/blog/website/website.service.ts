import {Injectable, Logger} from "@nestjs/common";
import {InjectModel} from "@nestjs/mongoose";
import * as cheerio from "cheerio";
import {Model} from "mongoose";
import replaceDomain from "../../common/replace-domain";
import {Article} from "../../schemas/article.schema";
import {Website} from "../../schemas/website.schema";

@Injectable()
export class WebsiteService {
  constructor(
      @InjectModel("Website") private websiteModel: Model<Website>,
      @InjectModel("Article") private articleModel: Model<Article>,
  ) {
  }

  private readonly logger = new Logger(WebsiteService.name);

  // 根据网站总访问量，倒序排列，获取所有网站
  async getWebsiteByPageView(page: number, limit: number): Promise<Website[]> {
    return await this.websiteModel
        .find()
        .sort({page_view: -1})
        .skip((page - 1) * limit)
        .limit(limit)
        .exec();
  }

  // 根据最近更新时间，倒序排列，获取所有网站，根据传入的page和limit分页
  async getWebsiteByLastPublish(
      page: number,
      limit: number,
  ): Promise<Website[]> {
    return await this.websiteModel
        .find()
        .sort({last_publish: -1})
        .skip((page - 1) * limit)
        .limit(limit)
        .exec();
  }

  // 根据id获取指定网站信息
  async getWebsiteById(id: string): Promise<Website> {
    return await this.websiteModel.findById(id).exec();
  }

  // 管理员增加网站
  async addWebsite(url: string, name: string): Promise<Website> {
    if (url.endsWith("/")) {
      url = url.slice(0, -1);
    }
    const website = new this.websiteModel({url: url, name: name});
    await website.save();
    await this.updateWebsiteInfo(url);
    return await this.websiteModel.findOne({url: url}).exec();
  }

  // 管理员修改网站信息
  async updateWebsite(
      id: string,
      url?: string,
      rss?: string,
      name?: string,
      description?: string,
      cover?: string,
  ): Promise<Website> {
    const website = await this.websiteModel.findById(id).exec();
    if (rss) {
      website.rss = rss;
    }
    if (description) {
      website.description = description;
    }
    if (cover) {
      website.cover = cover;
    }
    // 修改文章内的网站名
    if (name) {
      website.name = name;
      const articles = await this.articleModel.find({website_id: id}).exec();
      for (const article of articles) {
        await this.articleModel.findByIdAndUpdate(article._id, {
          author: name,
        });
      }
    }
    // 修改文章中的url
    if (url) {
      website.url = url;
      const articles = await this.articleModel.find({website_id: id}).exec();
      for (const article of articles) {
        await this.articleModel.findByIdAndUpdate(article._id, {
          url: replaceDomain(article.url, url),
          website: url,
        });
      }
    }
    return await website.save();
  }

  // 爬虫更新网站信息
  async updateWebsiteInfo(url: string): Promise<Website> {
    // 将相对域名转换为绝对域名
    function getAbsoluteUrl(domain: string, url: string) {
      if (url.startsWith("http")) {
        return url;
      } else {
        return `${domain}${url}`;
      }
    }

    // 发起Get请求，获取网页信息
    try {
      const response = await fetch(url);
      const html = await response.text();

      // 使用cheerio解析网页信息
      const $ = cheerio.load(html);

      // 提取title、description、rss、favicon信息
      const description = $('head meta[name="description"]').attr("content");
      const rss =
          $('head link[type="application/rss+xml"]').attr("href") ||
          $('head link[type="application/atom+xml"]').attr("href");
      const favIcon = $('head link[rel="icon"]').attr("href");
      const website = await this.websiteModel.findOne({url: url});

      website.cover = favIcon ? getAbsoluteUrl(url, favIcon) : null;
      website.description = description || "No description";
      website.rss = rss ? getAbsoluteUrl(url, rss) : null;
      return await website.save();
    } catch (err) {
      console.error(
          `Failed to scrape data for website ${url} with error: ${err}`,
      );
    }
  }

  // 管理员删除网站
  async deleteWebsite(id: string): Promise<String> {
    // 删除网站
    await this.websiteModel.findByIdAndDelete(id);

    // 删除网站下的所有文章
    const articles = await this.articleModel.find({website_id: id}).exec();
    for (const article of articles) {
      await this.articleModel.findByIdAndDelete(article._id);
    }
    return "Delete website successfully";
  }

  // 遍历网站下的文章，获取page_view，计算总访问量
  async updatePageView(id: string): Promise<Website> {
    // 利用websiteId去article中查找website_id为websiteId的所有文章，并按发布时间倒序排列
    const articles = await this.articleModel
        .find({website_id: id})
        .sort({publish_date: -1});

    // 计算所有文章的page_view总和
    const pageView = articles.reduce(
        (totalPageView, article) => totalPageView + article.page_view,
        0,
    );

    this.logger.log(`Update page_view of website ${id} to ${pageView}`);

    // 顺便更新最新文章发布时间
    const lastPublish = articles[0].publish_date;

    // 更新websiteModel中的page_view
    return await this.websiteModel
        .findByIdAndUpdate(id, {page_view: pageView, last_publish: lastPublish})
        .exec();
  }

  // 获取网站总数
  async getWebsiteCount(): Promise<number> {
    return await this.websiteModel.find().countDocuments().exec();
  }

  // 计算网站最近一年发布的文章
  async getLastYearArticleCount(id: string): Promise<number> {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    return new Promise((resolve, reject) => {
      this.articleModel.countDocuments(
          {
            website_id: id,
            publish_date: {$gte: oneYearAgo},
          },
          (err, count) => {
            if (err) {
              reject(err);
            } else {
              resolve(count);
            }
          },
      );
    });
  }

  // 随机抽取6个网站
  async getRandomWebsite(): Promise<Website[]> {
    return await this.websiteModel.aggregate([
      {$sample: {size: 6}},
    ]).exec();
  }
}
