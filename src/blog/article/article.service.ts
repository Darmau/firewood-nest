import {extract} from "@extractus/feed-extractor";
import {Injectable, Logger} from "@nestjs/common";
import {InjectModel} from "@nestjs/mongoose";
import mongoose, {Model} from "mongoose";
import getArticleInfo from "../../common/article-extract";
import convertDate from "../../common/convert-date";
import {Article} from "../../schemas/article.schema";
import {Website} from "../../schemas/website.schema";

@Injectable()
export class ArticleService {
  constructor(
      @InjectModel("Article") private articleModel: Model<Article>,
      @InjectModel("Website") private websiteModel: Model<Website>,
  ) {
  }

  private readonly logger = new Logger(ArticleService.name);

  // 根据最近发布时间，从最新到最旧，获取所有文章，排除被封禁的文章
  async getAllUnblockedArticle(
      page: number,
      limit: number,
  ): Promise<Article[]> {
    return await this.articleModel
        .find({isBlocked: {$ne: true}})
        .sort({publish_date: -1})
        .skip((page - 1) * limit)
        .limit(limit)
        .exec();
  }

  // 根据最近发布时间，从最新到最旧，获取所有文章
  async getAllArticle(page: number, limit: number): Promise<Article[]> {
    return await this.articleModel
        .find()
        .sort({publish_date: -1})
        .skip((page - 1) * limit)
        .limit(limit)
        .exec();
  }

  // 获取编辑推荐文章
  async getArticleByRecommend(page: number, limit: number): Promise<Article[]> {
    return await this.articleModel
        .find({isFeatured: true, isBlocked: {$ne: true}})
        .sort({publish_date: -1})
        .skip((page - 1) * limit)
        .limit(limit)
        .exec();
  }

  // 获取一周内浏览量最高的文章
  async getHotestArticle(limit: number): Promise<Article[]> {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return await this.articleModel
        .find({publish_date: {$gte: date}, isBlocked: {$ne: true}})
        .sort({page_view: -1})
        .limit(limit)
        .exec();
  }

  // 随机获取1篇文章
  async getRandomArticle(): Promise<Article[]> {
    return await this.articleModel.aggregate(([
      {$match: {isBlocked: {$ne: true}, abstract: {$ne: null}}},
      {$sample: {size: 1}}
    ])).exec();
  }

  // 获得指定分类的最新文章
  async getArticleByTopic(
      topic: string,
      page: number,
      limit: number,
  ): Promise<Article[]> {
    return await this.articleModel
        .find({topic: topic, isBlocked: {$ne: true}})
        .sort({publish_date: -1})
        .skip((page - 1) * limit)
        .limit(limit)
        .exec();
  }

  // 获取指定博客所有文章
  async getArticleByBlog(
      website: string,
      page: number,
      limit: number,
  ): Promise<Article[]> {
    return await this.articleModel
        .find({website: website, isBlocked: {$ne: true}})
        .sort({publish_date: -1})
        .skip((page - 1) * limit)
        .limit(limit)
        .exec();
  }

  // 新增文章
  async addArticle(
      url: string,
      website_id: mongoose.Types.ObjectId,
      website: string,
      title: string,
      description: string,
      publish_date: Date,
      author: string,
  ): Promise<Article | String> {
    // 查询是否已存在该 article
    const existArticle = await this.articleModel.findOne({url: url}).exec();
    if (existArticle) {
      return existArticle;
    }

    const article = await getArticleInfo(url, website);

    const newArticle = new this.articleModel({
      website_id: website_id,
      website: website,
      author: author,
      url: url,
      title: title,
      description: description,
      publish_date: publish_date,
      cover: article.covers,
      content: article.content,
      abstract: article.abstract,
      tags: article.tags,
      topic: article.topic,
    });

    await newArticle.save();

    // 读取网站的categories，如果文章的topic不在categories中，则将文章的topic添加到categories中
    const websiteInfo = await this.websiteModel.findById(website_id).exec();
    const categories = websiteInfo.categories;
    // 将topic为null的分类设定为"未分类"
    const articleTopic = article.topic ? article.topic : "未分类";
    if (categories.has(articleTopic)) {
      categories.set(articleTopic, categories.get(articleTopic) + 1);
    } else {
      categories.set(articleTopic, 1);
    }

    await this.websiteModel.findByIdAndUpdate(website_id, {
      categories: categories,
      last_crawl: new Date(),
    });
    return newArticle;
  }

  // 根据网站rss，获取网站最新文章，并传入addArticle方法
  async updateArticlesByWebsite(url: string): Promise<any> {
    const website = await this.websiteModel.findOne({url: url}).exec();

    if (!website) {
      throw new Error("没有找到对应的网站信息");
    }

    const websiteId = website._id;
    const websiteUrl = website.url;
    const author = website.name;
    const rss = website.rss;
    if (!rss) {
      throw new Error("该网站没有rss");
    }

    // 从feed中提取文章信息，并找到content和summary
    const feed = await extract(rss, {useISODateFormat: false});
    const limitedEntries = await feed.entries.slice(0, 50);

    for (const item of limitedEntries) {
      try {
        // 转换日期为统一的ISO格式
        const publish_date = convertDate(item.published);
        await this.addArticle(
            item.link,
            websiteId,
            websiteUrl,
            item.title,
            item.description,
            publish_date,
            author,
        );
      } catch {
        this.logger.error(
            `Add article ${item.title} of url ${item.link} failed`,
        );
        continue;
      }
      // 延迟1秒后执行下一次循环
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    // 更新网站文章数量
    const articleCount = await this.getArticleCountByWebsite(url);
    await this.websiteModel.findOneAndUpdate(
        {url: url},
        {article_count: articleCount},
    );
    return await this.websiteModel.findById(websiteId);
  }

  //切换某篇文章isFeatured的状态
  async setFeaturedArticle(id: string): Promise<Article> {
    const featuredArticle = await this.articleModel.findById(id).exec();
    featuredArticle.isFeatured = !featuredArticle.isFeatured;
    return await featuredArticle.save();
  }

  // 管理员封禁或解禁某篇文章
  async blockArticle(id: string): Promise<Article> {
    const blockedArticle = await this.articleModel.findById(id).exec();
    blockedArticle.isBlocked = !blockedArticle.isBlocked;
    return await blockedArticle.save();
  }

  //删除某篇文章
  async deleteArticle(id: string): Promise<Article> {
    return await this.articleModel.findByIdAndDelete(id);
  }

  // 根据文章website字段，统计指定网站的文章数量
  async getArticleCountByWebsite(website: string): Promise<number> {
    const blog = await this.websiteModel.findOne({url: website}).exec();
    const blogId = await blog._id;
    return await this.articleModel
        .find({website_id: blogId})
        .countDocuments()
        .exec();
  }

  // 访问量记录，每次访问，访问量+1
  async addPageView(id: string): Promise<Number> {
    const article = await this.articleModel.findById(id).exec();
    article.page_view += 1;
    await article.save();
    return article.page_view;
  }

  // 获取文章总数
  async getArticleCount(
      type: string,
      topic?: string,
      startAt?: Date,
      endAt?: Date,
  ): Promise<number> {
    switch (type) {
      case "all":
        return await this.articleModel.countDocuments().exec();

      case "featured":
        return await this.articleModel
            .countDocuments({isFeatured: true})
            .exec();

      case "topic":
        return await this.articleModel.countDocuments({topic: topic}).exec();

      case "date":
        return await this.articleModel
            .countDocuments({publish_date: {$gte: startAt, $lte: endAt}})
            .exec();

      default:
        return await this.articleModel.countDocuments().exec();
    }
  }

  // 修改文章分类
  async editArticleTopic(id: string, topic: string): Promise<Article> {
    const article = await this.articleModel.findById(id).exec();
    article.topic = topic;
    return await article.save();
  }

  async getArticleCountByBlog(id: string): Promise<number> {
    return await this.articleModel
        .find({website_id: id})
        .countDocuments()
        .exec();
  }
}
