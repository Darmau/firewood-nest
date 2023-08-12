import { IsUrl } from "class-validator";

export class UpdateWebsiteDto {
  @IsUrl()
  url: string;

  @IsUrl()
  rss: string;

  name: string;
  description: string;

  @IsUrl()
  cover: string;
}
