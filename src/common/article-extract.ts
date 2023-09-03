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
  description: string,
) {
  let article = null;
  let cover = null;
  let abstract = null;
  let tags = null;
  let topic = null;
  let retries = 0;
  const logger = new Logger();
  logger.debug(`Start extract article from ${url}`);

  while (!article && retries < 3) {
    try {
      article = await extract(
        url,
        {
          wordsPerMinute: 300,
          descriptionTruncateLen: 210,
          descriptionLengthThreshold: 120,
          contentLengthThreshold: 200,
        },
        {
          headers: {
            "user-agent":
              "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36",
          },
          signal: AbortSignal.timeout(15000),
        },
      );

      if (article.content) {
        const $ = cheerio.load(article.content);
        const contentString = $.text();

        const articleData = await AIProcess(contentString || description);

        if (articleData) {
          const articleJson = JSON.parse(articleData);
          // 获取文章摘要
          abstract = articleJson.abstract;

          // 获取文章标签
          tags = articleJson.tags;

          // 获取文章分类
          topic = getEnglishTopic(articleJson.category);
        }
      }

      if (article && article.image) {
        cover = await cloudflareImage(article.image, website);
      }
      logger.debug(`Successfully extract info from ${article.title}`);
      return {
        cover: cover || null,
        content: article.content || null,
        abstract: abstract,
        tags: tags,
        topic: topic,
      };
    } catch (error) {
      logger.error(`Cannot extract from ${url}, ${error}`);
      await new Promise((resolve) =>
        setTimeout(
          resolve,
          Math.floor(Math.random() * (3000 - 1000 + 1)) + 1000,
        ),
      );
      retries++;
    }
  }
  return {
    cover: null,
    content: null,
    abstract: null,
    tags: null,
    topic: null,
  };
}
