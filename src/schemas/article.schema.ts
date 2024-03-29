import { Prop, Schema, SchemaFactory, raw } from "@nestjs/mongoose";
import mongoose, { HydratedDocument } from "mongoose";
import { Website } from "./website.schema";

export type ArticleDocument = HydratedDocument<Article>;

@Schema()
export class Article {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: "Website",
    required: true,
  })
  website_id: Website;

  @Prop()
  website: string;

  @Prop()
  author: string;

  @Prop({
    required: true,
    unique: true,
    match: /^http(s)?:\/\/.+/,
    index: true,
  })
  url: string;

  @Prop({ required: true })
  title: string;

  @Prop({ default: "" })
  description: string;

  @Prop()
  publish_date: Date;

  @Prop()
  cover: string;

  @Prop({ default: false })
  isFeatured: boolean;

  @Prop({ default: [] })
  tags: [String];

  @Prop()
  topic: string;

  @Prop()
  abstract: string;

  @Prop({
    default: 0,
  })
  page_view: number;

  @Prop()
  content: string;

  @Prop({ default: false })
  isBlocked: boolean;

  @Prop({ default: 0 })
  crawl_error: number;
}

export const ArticleSchema = SchemaFactory.createForClass(Article);
