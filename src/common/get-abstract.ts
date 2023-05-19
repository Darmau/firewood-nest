import sliceString from "./slice-string";

export default async function getAbstract(title: string, content: string, token: string) {
  const abstractJson = await fetch(`https://aip.baidubce.com/rpc/2.0/nlp/v1/news_summary?charset=UTF-8&access_token=${token}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        title: title.slice(0, 200),
        content: content.slice(0, 3000),
        max_summary_len: 120,
      })
    })
  const abstractData = await abstractJson.json();
  return abstractData.summary;
}