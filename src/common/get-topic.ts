import sliceString from "./slice-string";

export default async function getTopic(title: string, content: string, token: string) {
  const topicJson = await fetch(`https://aip.baidubce.com/rpc/2.0/nlp/v1/topic?charset=UTF-8&access_token=${token}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        title: sliceString(title, 80),
        content: sliceString(content, 65535)
      })
    });

    try {
      const topic = await topicJson.json();
      return topic.item.lv1_tag_list[0].tag;
    } catch {
      return null;
    }
}