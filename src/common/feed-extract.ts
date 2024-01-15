export default async function feedExtract(feedUrl: string) {
  try {
    // 请求https://vbwbtqsflwkgwxobfkhs.supabase.co/functions/v1/rss?url=
    let feed = await fetch(`${process.env.SUPABASE_EDGE_FUNCTION}/rss`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({url: feedUrl}),
    }).then((res) => res.json());
    return feed;
  } catch (error) {
    throw new Error(`Error happen on extract ${feedUrl}: ${error}`);
  }
}
