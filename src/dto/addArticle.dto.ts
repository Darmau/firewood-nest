import { IsNotEmpty, IsUrl } from "class-validator";
import mongoose from "mongoose";

export class AddArticleDto {
  @IsUrl()
  @IsNotEmpty()
  url: string;

  @IsNotEmpty()
  website_id: mongoose.Types.ObjectId;

  @IsUrl()
  website: string;

  author: string;

  @IsNotEmpty()
  title: string;

  description: string;

  publish_date: Date;

  cover: string;
  
  content: string;
}