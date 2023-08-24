import { extract } from "@extractus/article-extractor";
import * as cheerio from "cheerio";
import cloudflareImage from "./cloudflare-image";
import AIProcess from "./open-ai";
import getEnglishTopic from "./get-english-topic";
import { Logger } from "@nestjs/common";

// 本函数用于从文章中提取出相应信息，包括标题、描述、内容、图片等。
export default async function getArticleInfo(
  url: string,
  website: string,
  description: string
) {
  let article = null;
  let cover = null;
  let abstract = null;
  let tags = null;
  let topic = null;
  const logger = new Logger();
  logger.debug(`Start extract article from ${url}`)

  try {
    article = await extract(url);

    if (article.content) {
      const $ = cheerio.load(article.content);
      const contentString = $.text();

      const articleData = await AIProcess(contentString || description);
      const articleJson = JSON.parse(articleData);
      // 获取文章摘要
      abstract = articleJson.abstract;

      // 获取文章标签
      tags = articleJson.tags;

      // 获取文章分类
      topic = getEnglishTopic(articleJson.category);
    }

    if (article && article.image) {
      cover = await cloudflareImage(article.image, website);
    }
    logger.debug(`Successfully extract info from ${article.title}`)
    return {
      cover: cover,
      content: article.content || null,
      abstract: abstract,
      tags: tags,
      topic: topic,
    };
  } catch (error) {
    this.logger.error(`Cannot extract from ${url}, ${error}`);
    return {
      cover: null,
      content: null,
      abstract: null,
      tags: null,
      topic: null,
    };
  }
}
