import { Document } from "mongoose";

export interface Blog extends Document {
  url: string;
  name: string;
  description: string;
  cover: string;
  article_count: number;
  page_view: number;
  frequency: number;
  last_publish: Date;
}