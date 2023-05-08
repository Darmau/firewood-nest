//本函数接收多个文件，将其上传至腾讯云COS，返回一个数组，数组中的每个元素是一个对象，包含了文件的上传路径和文件名
const COS = require('cos-nodejs-sdk-v5');

// 接收folder和image buffer，上传至指定bucket
async function upload(folder: string, fileName: string, image: Buffer, format: string) {
  const cos = new COS({
    SecretId: process.env.COS_SECRET_ID,
    SecretKey: process.env.COS_SECRET_KEY,
  })

  const path = `${folder}/${fileName}.${format}`
  return new Promise((resolve, reject) => {
    cos.putObject({
      Bucket: process.env.COS_BUCKET,
      Region: process.env.COS_REGION,
      Key: path,
      Body: Buffer.from(image),
    }, function (err, data) {
      if (err) { reject(err); return; }
      resolve(data.Location)
    })
  })
}

export default async function uploadImage(website: string, images: Image) {
  const fileName = Date.now().toString()
  const jpg = await upload(website, fileName, images.jpg, 'jpg')
  const webp = await upload(website, fileName, images.webp, 'webp')
  const avif = await upload(website, fileName, images.avif, 'avif')

  return {
    jpg: jpg,
    webp: webp,
    avif: avif,
  }
}

interface Image {
  jpg: Buffer,
  webp: Buffer,
  avif: Buffer
}