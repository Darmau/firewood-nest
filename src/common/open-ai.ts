export default async function AIProcess(content: string) {
  const TOKEN = process.env.WORKERS_TOKEN;
  const API = process.env.WORKERS_API;
  const articleJsonString = await fetch(API, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=UTF-8',
      'Accept': 'text/plain',
      'Authorization': `Bearer ${TOKEN}`
    },
    body: content
  });
  try {
    const articleData = await articleJsonString.json();
    return articleData;
  } catch {
    return null
  }
}