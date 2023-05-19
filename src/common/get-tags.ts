import sliceString from "./slice-string";

export default async function getTags(title: string, content: string, token: string) {
  
  const tagsJson = await fetch(`https://aip.baidubce.com/rpc/2.0/nlp/v1/keyword?charset=UTF-8&access_token=${token}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        title: sliceString(title, 80),
        content: sliceString(content, 65535),
      })
    });
  const tagsData = await tagsJson.json();
  const tags = await tagsData.items.map((item) => item.tag);
  return tags;
}