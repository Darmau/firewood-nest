export default async function getBaiduToken() {
  const api = process.env.BAIDU_API_KEY;
  const secret = process.env.BAIDU_SECRET_KEY;

  const response = await fetch(`https://aip.baidubce.com/oauth/2.0/token?client_id=${api}&client_secret=${secret}&grant_type=client_credentials`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    }
  );
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error_description);
  }
  return data.access_token;
}