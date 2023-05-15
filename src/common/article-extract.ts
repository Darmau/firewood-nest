import { extract } from '@extractus/article-extractor'
import imageProcess from './image-process';
import * as cheerio from 'cheerio';

// 本函数用于从文章中提取出相应信息，包括标题、描述、内容、图片等。
export default async function getArticleInfo(url: string, website: string, token: string) {
  let article;
  let retries = 0;
  let images = null;
  let abstract = '';
  let tags = [];
  while (!article && retries < 2) {
    try {
      article = await extract(url);
      const $ = await cheerio.load(article.content);
      const contentString = await $.text();
      // 获取文章摘要
      const abstractJson = await fetch(`https://aip.baidubce.com/rpc/2.0/nlp/v1/news_summary?charset=UTF-8&access_token=${token}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: article.title,
          content: contentString.slice(0, 3000),
          max_summary_len: 120,
        })
      })
      const abstractData = await abstractJson.json();
      abstract = await abstractData.summary;

      // 获取文章标签
      const tagsJson = await fetch(`https://aip.baidubce.com/rpc/2.0/nlp/v1/keyword?charset=UTF-8&access_token=${token}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: article.title,
          content: contentString.slice(0, 3000),
        })
      });
      const tagsData = await tagsJson.json();
      tags = await tagsData.items;

    } catch (error) {
      console.error(`Error extracting article: ${error}`);
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
    };
  }
  try {
    images = await imageProcess(website, article.image);
  } catch {
    images = null
  }
  return {
    covers: images,
    content: article.content,
    abstract: abstract,
    tags: tags,
  };
}