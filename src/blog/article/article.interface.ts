import mongoose, { Document } from "mongoose";

export interface Article extends Document {
  website_id: mongoose.Schema.Types.ObjectId,
  website: string,
  url: string,
  title: string,
  description: string,
  publish_date: Date,
  cover: string,
  isFeature: boolean,
  tags: string[],
  page_view: number,
  content: string,
  isBlocked: boolean,
}