// 本函数接收一个图片url，将其分别传入image-compress和upload-cos，返回一个包含jpg、webp、avif图片链接的对象
import downloadImage from './download-image';
import imageCompress from './image-compress';
import uploadImage from './upload-cos';

export default async function imageProcess(website: string, url: string) {
  if (!/^https?:\/\/[^\s/$.?#].[^\s]*\.(jpg|jpeg|png|gif|webp|avif)$/.test(url)) { return null }

  try {
    // 将网址去掉协议名和www，只保留主域名
    const domain = website.replace(/(http|https):\/\//, '').replace(/www\./, '').split('/')[0];

    // 下载图片
    const image = await downloadImage(url);

    // 传入图片压缩函数image-compress，压缩图片
    const compressedImage = await imageCompress(image);

    // 将压缩后的图片传入upload-cos，上传到腾讯云对象存储，website作为文件名前缀
    const cosImage = await uploadImage(domain, compressedImage);

    // 返回一个包含mozjpeg、webp、avif图片链接的对象
    return cosImage;
  }
  catch { 
    console.error(website + ': Image process failed');
    return null;
  }
}