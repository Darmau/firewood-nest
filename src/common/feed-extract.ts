import { extract } from "@extractus/feed-extractor";

export default async function feedExtract(feedUrl: string) {
  let feed = await extract(feedUrl);
  // 如果日期不存在，需要重新提取
  if (!feed.entries[0].published) {
    feed = await extract(feedUrl, { useISODateFormat: false });
  }
  return feed.entries.slice(0, 30);
}
