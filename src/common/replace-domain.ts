// 接收一个url和域名，将url中的域名替换为传入的新域名
export default function replaceDomain(url: string, domain: string): string {
  const parsedUrl = new URL(url);
  parsedUrl.hostname = new URL(domain).hostname;
  return parsedUrl.href;
}