// 用于将中文的分类转换成英文
export default function getEnglishTopic(chinese: string) {
  const topicList = new Map([
    ["技术", "tech"],
    ["编程", "code"],
    ["社会", "society"],
    ["日记", "diary"],
    ["生活", "life"],
    ["政治", "politics"],
    ["职场", "career"],
    ["旅行", "travel"],
    ["人文社科", "culture"],
    ["学习", "education"],
    ["情感", "emotion"],
    ["综合", "others"],
  ]);

  if (!topicList.has(chinese)) {
    return "others";
  }

  return topicList.get(chinese);
}
