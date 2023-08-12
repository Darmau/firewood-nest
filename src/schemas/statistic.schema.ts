import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type StatisticDocument = HydratedDocument<Statistic>;

@Schema()
export class Statistic {
  @Prop({
    required: true,
  })
  date: Date;

  @Prop({
    default: 0,
  })
  website_count: number;

  @Prop({
    default: 0,
  })
  article_count: number;

  @Prop()
  inaccessible_article: number;
}

export const StatisticSchema = SchemaFactory.createForClass(Statistic);
