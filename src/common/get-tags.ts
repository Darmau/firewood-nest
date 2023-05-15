export default async function getTags(title: string, content: string, token: string) {
  const tagsJson = await fetch(`https://aip.baidubce.com/rpc/2.0/nlp/v1/keyword?charset=UTF-8&access_token=${token}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: title,
        content: content.slice(0, 3000),
      })
    });
  const tagsData = await tagsJson.json();
  return tagsData.items;
}