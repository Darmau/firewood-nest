import {Logger} from "@nestjs/common";

export default async function feedExtract(feedUrl: string) {
  const logger = new Logger();
  try {
    // 请求https://vbwbtqsflwkgwxobfkhs.supabase.co/functions/v1/rss?url=
    let feed = await fetch(`${process.env.SUPABASE_EDGE_FUNCTION}/rss?url=${feedUrl}`, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.SUPABASE_ANON_KEY}`
      },
    })
    .then((res) => res.json());
    return feed.entries.slice(0, 30);
  } catch (error) {
    logger.error(`Error happen on extract ${feedUrl}: ${error}`);
    throw new Error(`Error happen on extract ${feedUrl}: ${error}`)
  }
}
