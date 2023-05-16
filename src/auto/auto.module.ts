import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BlogModule } from 'src/blog/blog.module';
import { WebsiteSchema } from 'src/schemas/website.schema';
import { AutoService } from './auto.service';
import { ArticleSchema } from 'src/schemas/article.schema';
import { StatisticSchema } from 'src/schemas/statistic.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'Website', schema: WebsiteSchema }, { name: 'Article', schema: ArticleSchema }, { name: 'Statistic', schema: StatisticSchema }]), BlogModule],
  providers: [AutoService],
  controllers: []
})
export class AutoModule { }
