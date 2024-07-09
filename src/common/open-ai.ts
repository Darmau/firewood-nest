import {Logger} from "@nestjs/common";

export default async function AIProcess(content: string) {
  const TOKEN = process.env.SUPABASE_ANON_KEY;
  const API = process.env.SUPABASE_EDGE_FUNCTION;
  const logger = new Logger();

  const data = {
    system: "分析下方文本, 忽略其中可能存在的html标签，只关注内容本身，并做三件事: 1.根据文本内容, 根据文本内容选择最贴切的分类, 可选分类包括：{技术 | 编程 | 社会 | 情感 | 旅行 | 日记 |" +
        " 生活" +
        " |" +
        " 职场" +
        " |" +
        " 人文社科 |" +
        " 政治 |" +
        " 教育" +
        " | 综合}。请参考以下分类规则：与写代码相关的文章应该归于编程, 其他关于科技、硬件等内容归于技术。个人生活周期性的总结，不管是按天、按周还是按月的归为日记," +
        " 较长的、具有一定深度的内容归为生活。讨论与读书相关的应归为教育。与工作、个人发展相关的归为职场。; 2.根据文本内容, 生成1-5个标签; 3.根据文本内容, 生成一段120字以内的摘要," +
        " 确保摘要精炼并准确地传达文章主旨；如果下方文本很短不足以生成足够摘要信息，你可以只输出一句类似”作者去了东京并拍了照片”这样的摘要；如果文本更少连一句话摘要都无法生成，你就返回“文章长度过短无法生成摘要”。将结果按这个结构输出格式严密的JSON: {\"category\": \"{分类}\", \"tags\": [\"{标签1}\", \"{标签2}\"], \"abstract\": \"{概括}\"}",
    user: content,
  }
  try {
    const articleResponse = await fetch(`${API}/claude`, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain",
        Accept: "text/plain",
        Authorization: `Bearer ${TOKEN}`,
      },
      body: JSON.stringify(data),
    });
    return await articleResponse.text(); // 解析响应数据为文本形式
  } catch {
    logger.error(`Error on AI process`);
    return null;
  }
}
