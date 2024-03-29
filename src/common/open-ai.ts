import {Logger} from "@nestjs/common";

export default async function AIProcess(content: string) {
  const TOKEN = process.env.WORKERS_TOKEN;
  const API = process.env.WORKERS_API;
  const logger = new Logger();
  try {
    const articleResponse = await fetch(API, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain",
        Accept: "text/plain",
        Authorization: `Bearer ${TOKEN}`,
      },
      body: content,
    });
    const articleData = await articleResponse.text(); // 解析响应数据为文本形式
    return articleData;
  } catch {
    logger.error(`Error on AI process`);
    return null;
  }
}
