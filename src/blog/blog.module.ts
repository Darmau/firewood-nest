import {Module} from "@nestjs/common";
import {WebsiteController} from "@/blog/website/website.controller";
import {ArticleController} from "@/blog/article/article.controller";
import {WebsiteService} from "@/blog/website/website.service";
import {ArticleService} from "@/blog/article/article.service";
import {MongooseModule} from "@nestjs/mongoose";
import {WebsiteSchema} from "@/schemas/website.schema";
import {ArticleSchema} from "@/schemas/article.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      {name: "Website", schema: WebsiteSchema},
      {name: "Article", schema: ArticleSchema},
    ]),
  ],
  controllers: [WebsiteController, ArticleController],
  providers: [WebsiteService, ArticleService],
  exports: [WebsiteService, ArticleService],
})
export class BlogModule {
}
