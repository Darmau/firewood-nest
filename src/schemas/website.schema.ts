import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type WebsiteDocument = HydratedDocument<Website>;

@Schema()
export class Website {
  @Prop({
    required: true,
    unique: true,
    match: /^http(s)?:\/\/.+/,
    index: true,
  })
  url: string;

  @Prop()
  rss: string;

  @Prop({
    required: true,
  })
  name: string;

  @Prop({
    default: '',
  })
  description: string;

  @Prop({
    default: '',
    match: /^http(s)?:\/\/.+/,
  })
  cover: string;

  @Prop({
    default: 0,
  })
  article_count: number;

  @Prop({
    default: 0,
  })
  page_view: number;

  @Prop({ default: Date.now, })
  last_publish: Date;

  @Prop({
    default: Date.now,
  })
  last_crawl: Date;

  @Prop({
    default: 0,
  })
  crawl_error: number;
}

export const WebsiteSchema = SchemaFactory.createForClass(Website);