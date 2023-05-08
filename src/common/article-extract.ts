import { extract } from '@extractus/article-extractor'
import imageProcess from './image-process';

// 本函数用于从文章中提取出相应信息，包括标题、描述、内容、图片等。
export default async function getArticleInfo(url: string, website: string) {
  let article;
  let retries = 0;
  let images = null;
  while (!article && retries < 2) {
    try {
      article = await extract(url);
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
  };
}