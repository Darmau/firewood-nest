import { HttpException, Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import * as cheerio from "cheerio";
import { Model } from "mongoose";
import replaceDomain from "@/common/replace-domain";
import { Article } from "@/schemas/article.schema";
import { Website } from "@/schemas/website.schema";

@Injectable()
export class WebsiteService {
  constructor(
    @InjectModel("Website") private websiteModel: Model<Website>,
    @InjectModel("Article") private articleModel: Model<Article>,
  ) {}

  private readonly logger = new Logger(WebsiteService.name);

  // 根据网站总访问量，倒序排列，获取所有网站
  async getWebsiteByPageView(
      page: number,
      limit: number
  ): Promise<Website[]> {
    return await this.websiteModel
      .find({ article_count: { $gt: 0 } })
      .sort({ page_view: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .allowDiskUse(true)
      .exec();
  }

  // 根据最近更新时间，倒序排列，获取所有网站，根据传入的page和limit分页
  async getWebsiteByLastPublish(
    page: number,
    limit: number,
  ): Promise<Website[]> {
    return await this.websiteModel
      .find({ article_count: { $gt: 0 } })
      .sort({ last_publish: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .allowDiskUse(true)
      .exec();
  }

  // 返回所有文章
  async getAllWebsite(
      page: number,
      limit: number
  ): Promise<Website[]> {
    return await this.websiteModel
                     .find()
                     .sort({ last_publish: -1 })
                     .skip((page - 1) * limit)
                     .limit(limit)
                     .allowDiskUse(true)
                     .exec();
  }

  // 根据id获取指定网站信息
  async getWebsiteById(id: string): Promise<Website> {
    return await this.websiteModel.findById(id).exec();
  }

  // 根据url获取网站信息
  async getWebsiteByUrl(url: string): Promise<Website> {
    const website = await this.websiteModel.findOne({ url: url }).exec();
    if (!website) {
      throw new HttpException("Website not found", 404);
    }
    return website;
  }

  // 管理员增加网站
  async addWebsite(url: string, name: string): Promise<Website> {
    if (url.endsWith("/")) {
      url = url.slice(0, -1);
    }
    const website = new this.websiteModel({ url: url, name: name });
    await website.save();
    await this.updateWebsiteInfo(url);
    return await this.websiteModel.findOne({ url: url }).exec();
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
      const articles = await this.articleModel.find({ website_id: id }).allowDiskUse(true).exec();
      for (const article of articles) {
        await this.articleModel.findByIdAndUpdate(article._id, {
          author: name,
        });
      }
    }
    // 修改文章中的url
    if (url) {
      website.url = url;
      const articles = await this.articleModel.find({ website_id: id }).allowDiskUse(true).exec();
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
      const website = await this.websiteModel.findOne({ url: url });

      website.cover = favIcon ? getAbsoluteUrl(url, favIcon) : null;
      website.description = description || "No description";
      website.rss = rss ? getAbsoluteUrl(url, rss) : null;
      return await website.save();
    } catch (err) {
      this.logger.error(
        `Failed to scrape data for website ${url} with error: ${err}`,
      );
    }
  }

  // 管理员删除网站
  async deleteWebsite(id: string): Promise<String> {
    // 删除网站
    await this.websiteModel.findByIdAndDelete(id);

    // 删除网站下的所有文章
    const articles = await this.articleModel.find({ website_id: id }).allowDiskUse(true).exec();
    for (const article of articles) {
      await this.articleModel.findByIdAndDelete(article._id);
    }
    return "Delete website successfully";
  }

  // 遍历网站下的文章，计算访问量、分类以及最新发布时间
  async updatePageView(id: string): Promise<Website> {
    // 利用websiteId去article中查找website_id为websiteId的所有文章，并按发布时间倒序排列
    const articles = await this.articleModel
      .find({ website_id: id })
      .sort({ publish_date: -1 })
      .allowDiskUse(true);

    // 计算所有文章的page_view总和
    const pageView = articles.reduce(
      (totalPageView, article) => totalPageView + article.page_view,
      0,
    );

    this.logger.log(`Update page_view of website ${id} to ${pageView}`);

    // 统计文章的分类
    const articleCategories = new Map<string, number>();
    for (const article of articles) {
      const topic = article.topic || "未分类";
      if (articleCategories.has(topic)) {
        articleCategories.set(topic, articleCategories.get(topic) + 1);
      } else {
        articleCategories.set(topic, 1);
      }
    }

    // 顺便更新最新文章发布时间
    const lastPublish = articles[0].publish_date;

    // 更新websiteModel中的page_view
    return await this.websiteModel
      .findByIdAndUpdate(id, {
        page_view: pageView,
        categories: articleCategories,
        last_publish: lastPublish,
      })
      .exec();
  }

  // 获取网站总数
  async getWebsiteCount(): Promise<number> {
    return await this.websiteModel.find().countDocuments().exec();
  }

  // 计算网站最近一年发布的文章
  async getLastYearArticleCount(id: string): Promise<number> {
    if (!id) {
      throw new HttpException("Invalid website id", 400);
    }
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const count = await this.articleModel.countDocuments({
      website_id: id,
      publish_date: { $gte: oneYearAgo },
    });
    return count;
  }

  // 随机抽取6个网站
  async getRandomWebsite(): Promise<Website[]> {
    return await this.websiteModel.aggregate([{ $sample: { size: 6 } }]).exec();
  }
}
