import { Module } from '@nestjs/common';
import { WebsiteController } from './website/website.controller';
import { ArticleController } from './article/article.controller';
import { WebsiteService } from './website/website.service';
import { ArticleService } from './article/article.service';
import { MongooseModule } from '@nestjs/mongoose';
import { WebsiteSchema } from 'src/schemas/website.schema';
import { ArticleSchema } from 'src/schemas/article.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'Website', schema: WebsiteSchema }, { name: 'Article', schema: ArticleSchema }, { name: 'Statistic', schema: ArticleSchema }])],
  controllers: [WebsiteController, ArticleController],
  providers: [WebsiteService, ArticleService],
  exports: [WebsiteService, ArticleService]
})
export class BlogModule { }
