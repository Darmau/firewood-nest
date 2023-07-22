import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BlogModule } from '../blog/blog.module';
import { WebsiteSchema } from '../schemas/website.schema';
import { AutoService } from './auto.service';
import { ArticleSchema } from '../schemas/article.schema';
import { StatisticSchema } from '../schemas/statistic.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'Website', schema: WebsiteSchema }, { name: 'Article', schema: ArticleSchema }, { name: 'Statistic', schema: StatisticSchema }]), BlogModule],
  providers: [AutoService],
  controllers: []
})
export class AutoModule { }
