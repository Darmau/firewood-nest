import { extract } from '@extractus/article-extractor'
import imageProcess from './image-process';
import * as cheerio from 'cheerio';
import getAbstract from './get-abstract';
import getTags from './get-tags';
import getTopic from './get-topic';

// 本函数用于从文章中提取出相应信息，包括标题、描述、内容、图片等。
export default async function getArticleInfo(url: string, website: string, token: string) {
  let article;
  let retries = 0;
  let images = null;
  let abstract = null;
  let tags = null;
  let topic = null;
  while (!article && retries < 2) {
    try {
      article = await extract(url);
      if (article.content) {
        const $ = await cheerio.load(article.content);
        const contentString = await $.text();
        // 获取文章摘要
        abstract = await getAbstract(article.title, contentString, token);

        // 获取文章标签
        tags = await getTags(article.title, contentString, token);

        // 获取文章分类
        topic = await getTopic(article.title, contentString, token);
      }

    } catch (error) {
      console.error(`Error extracting article: ${error}`);
      return {
        cover: null,
        content: article.content || null,
        abstract: abstract,
        tags: tags,
        topic: topic,
      };
    }
    // 添加随机延时，1-10秒之间
    await new Promise(resolve => setTimeout(resolve, Math.random() * 10000));

    retries++;
  }
  if (!article) {
    return {
      cover: null,
      content: null,
      abstract: null,
      tags: null,
      topic: null,
    };
  }
  try {
    images = await imageProcess(website, article.image);
  } catch {
    console.error(`Error processing image of: ${article.title}`);
  }
  return {
    covers: images,
    content: article.content || null,
    abstract: abstract,
    tags: tags,
    topic: topic,
  };
}