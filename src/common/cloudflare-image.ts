import {Logger} from "@nestjs/common";

export default async function cloudflareImage(imgUrl: string, website: string) {
  const API_TOKEN = process.env.CLOUDFLARE_IMAGE_TOKEN;
  const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
  const URL = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/images/v1`;
  const DOMAIN = getDomain(website);
  const HASH = process.env.CLOUDFLARE_ACCOUNT_HASH;
  const logger = new Logger();

  const formData = new FormData();
  formData.append("url", imgUrl);
  formData.append(
    "metadata",
    JSON.stringify({
      blog: DOMAIN,
    }),
  );
  formData.append("requireSignedURLs", "false");

  try {
    const response = await fetch(URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
      },
      body: formData,
    });

    if (response.status !== 200) {
      logger.error("Error uploading image to Cloudflare Image", response);
      return null;
    }

    const data = await response.json();
    return `https://imagedelivery.net/${HASH}/${data.result.id}`;
  } catch (error) {
    logger.error("Error uploading image to Cloudflare Image", error);
    return null;
  }
}

function getDomain(website: string) {
  const parsedUrl = new URL(website);
  return parsedUrl.hostname;
}
