import { extract } from '@extractus/article-extractor';
import * as cheerio from 'cheerio';
import cloudflareImage from './cloudflare-image';
import AIProcess from './open-ai';

// 本函数用于从文章中提取出相应信息，包括标题、描述、内容、图片等。
export default async function getArticleInfo(url: string, website: string) {
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

        const articleData = await AIProcess(contentString);
        const articleJson = await JSON.parse(articleData)
        // 获取文章摘要
        abstract = await articleJson.abstract;

        // 获取文章标签
        tags = await articleJson.tags;

        // 获取文章分类
        topic = await getEnglishTopic(articleJson.category);
      }

    } catch (error) {
      console.error(`Error extracting article: ${error}`);
      return {
        cover: null,
        content: article ? article.content : null,
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
    images = await cloudflareImage(article.image, website);
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

// 用于将中文的分类转换成英文
function getEnglishTopic(chinese) {
  const topicList = new Map([
    ['技术', 'tech'],
    ['编程', 'code'],
    ['社会', 'society'],
    ['情感', 'emotion'],
    ['旅行', 'travel'],
    ['日记', 'diary'],
    ['生活', 'life'],
    ['职场', 'career'],
    ['人文社科', 'culture'],
    ['政治', 'politics'],
    ['教育', 'education'],
    ['综合', 'others'],
  ]);

  if(!topicList.has(chinese)) {
    return 'others'
  }

  return topicList.get(chinese);
}