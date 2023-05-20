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
      return getEnglishTopic(topic.item.lv1_tag_list[0].tag);
    } catch {
      return 'others';
    }
}

function getEnglishTopic(chinese) {
  const topicList = new Map([
    ['国际', 'international'],
    ['体育', 'sports'],
    ['娱乐', 'entertainment'],
    ['社会', 'society'],
    ['财经', 'finance'],
    ['时事', 'politics'],
    ['科技', 'tech'],
    ['情感', 'emotion'],
    ['汽车', 'automobile'],
    ['教育', 'education'],
    ['时尚', 'fashion'],
    ['游戏', 'game'],
    ['军事', 'military'],
    ['旅游', 'travel'],
    ['美食', 'food'],
    ['文化', 'culture'],
    ['健康', 'health'],
    ['搞笑', 'humor'],
    ['家居', 'home'],
    ['动漫', 'comic'],
    ['宠物', 'pet'],
    ['母婴', 'baby'],
    ['星座', 'constellation'],
    ['历史', 'history'],
    ['音乐', 'music'],
    ['综合', 'others'],
  ]);

  if(!topicList.has(chinese)) {
    return 'others'
  }

  return topicList.get(chinese);
}