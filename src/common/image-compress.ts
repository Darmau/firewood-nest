// 本函数接收一个图片文件，将其压缩为jpg、webp、avif格式，返回一个包含这三种格式图片的对象
import * as sharp from "sharp"

export default async function imageCompress(img: string) {
  const input = await fetch(img).then(res => res.arrayBuffer())

  const jpg = await sharp(input).jpeg({ quality: 85 }).toBuffer()
  const webp = await sharp(input).webp({ quality: 85 }).toBuffer()
  const avif = await sharp(input).avif({ quality: 85 }).toBuffer()

  return {
    jpg: jpg,
    webp: webp,
    avif: avif,
  }
}