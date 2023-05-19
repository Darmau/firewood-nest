import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as cheerio from 'cheerio';
import { Model } from 'mongoose';
import { Article } from 'src/schemas/article.schema';
import { Website } from 'src/schemas/website.schema';
import { ArticleService } from '../article/article.service';

@Injectable()
export class WebsiteService {
  constructor(
    @InjectModel('Website') private websiteModel: Model<Website>,
    @InjectModel('Article') private articleModel: Model<Article>,
  ) { }

  // 根据网站总访问量，倒序排列，获取所有网站
  async getWebsiteByPageView(page: number, limit: number): Promise<Website[]> {
    return await this.websiteModel.find().sort({ page_view: -1 }).skip((page - 1) * limit).limit(limit).exec();
  }

  // 根据最近更新时间，倒序排列，获取所有网站，根据传入的page和limit分页
  async getWebsiteByLastPublish(page: number, limit: number): Promise<Website[]> {
    return await this.websiteModel.find().sort({ publish_date: -1 }).skip((page - 1) * limit).limit(limit).exec();
  }

  // 根据id获取指定网站信息
  async getWebsiteById(id: string): Promise<Website> {
    return await this.websiteModel.findById(id).exec();
  }

  // 管理员增加网站
  async addWebsite(url: string, name: string): Promise<Website> {
    if (url.endsWith('/')) {
      url = url.slice(0, -1);
    }
    const website = new this.websiteModel({ url: url, name: name });
    const newSite = await website.save();
    await this.updateWebsiteInfo(url);
    return newSite;
  }

  // 管理员修改网站信息
  async updateWebsite(id: string, url?: string, rss?: string, name?: string, description?: string, cover?: string): Promise<Website> {
    const website = await this.websiteModel.findById(id).exec();
    if (url) { website.url = url; }
    if (rss) { website.rss = rss; }
    if (description) { website.description = description; }
    if (cover) { website.cover = cover; }
    // 修改文章内的网站名
    if (name) {
      website.name = name;
      const articles = await this.articleModel.find({ website_id: id }).exec();
      for (const article of articles) {
        await this.articleModel.findByIdAndUpdate(
          article._id,
          { author: name },
        );
      };
    }
    const newSite = await website.save();
    return newSite;
  }

  // 爬虫更新网站信息
  async updateWebsiteInfo(url: string): Promise<Website> {
    // 将相对域名转换为绝对域名
    function getAbsoluteUrl(domain: string, url: string) {
      if (url.startsWith('http')) {
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
      const description = $('head meta[name="description"]').attr('content');
      const rss = $('head link[type="application/rss+xml"]').attr('href') || $('head link[type="application/atom+xml"]').attr('href');
      const favIcon = $('head link[rel="icon"]').attr('href');
      const website = await this.websiteModel.findOne({ url: url });

      website.cover = favIcon ? getAbsoluteUrl(url, favIcon) : null;
      website.description = description || 'No description';
      website.rss = rss ? getAbsoluteUrl(url, rss) : null;
      return await website.save();

    } catch (err) {
      console.error(`Failed to scrape data for website ${url} with error: ${err}`);
    }

  }

  // 管理员删除网站
  async deleteWebsite(id: string): Promise<String> {
    // 删除网站
    await this.websiteModel.findByIdAndDelete(id);

    // 删除网站下的所有文章
    const articles = await this.articleModel.find({ website_id: id }).exec();
    for (const article of articles) {
      await this.articleModel.findByIdAndDelete(article._id);
    };
    return "Delete website successfully";
  }

  // 遍历网站下的文章，获取page_view，计算总访问量
  async updatePageView(url: string): Promise<void> {
    // 根据网站url在websiteModel中查找相应的id
    const website = await this.websiteModel.findOne({ url: url }).exec();
    const websiteId = await website._id;

    // 利用websiteId去article中查找website_id为websiteId的所有文章，并按发布时间倒序排列
    const articles = await this.articleModel.find({ website_id: websiteId }).sort({ publish_date: -1 }).exec();

    // 计算所有文章的page_view总和
    let pageView = 0;
    for (const article of articles) {
      pageView += article.page_view;
    }

    // 顺便更新最新文章发布时间
    const lastPublish = await articles[0].publish_date;

    // 更新websiteModel中的page_view
    await this.websiteModel.findByIdAndUpdate(websiteId, { page_view: pageView, last_publish: lastPublish });
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
      this.articleModel.countDocuments({
        website_id: id,
        publish_date: { $gte: oneYearAgo },
      }, (err, count) => {
        if (err) {
          reject(err);
        } else {
          resolve(count);
        }
      });
    });
  }

}