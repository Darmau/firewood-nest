export default async function getTopic(title: string, content: string, token: string) {
  const topicJson = await fetch(`https://aip.baidubce.com/rpc/2.0/nlp/v1/topic?charset=UTF-8&access_token=${token}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        title: title,
        content: content,
      })
    });

  const topic = await topicJson.json();
  const lv1_tag = await topic.item.lv1_tag_list[0].tag;
  const lv2_tag = await topic.item.lv2_tag_list.map((item) => item.tag);

  return {
    lv1: lv1_tag,
    lv2: lv2_tag,
  };
}