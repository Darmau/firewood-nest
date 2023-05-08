export default async function downloadImage(url: string) {
  // 下载图片
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Download image failed');
  }
  const buffer = await response.arrayBuffer();
  const dataView = new DataView(buffer);
  const blob = new Blob([dataView], { type: response.headers.get('Content-Type') });
  const image = URL.createObjectURL(blob);
  
  return image;
}