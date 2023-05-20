import { Body, Controller, Get, Post, Put, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/auth/auth.guard';
import { AddArticleDto } from 'src/dto/addArticle.dto';
import { ArticleService } from './article.service';

@Controller('article')
export class ArticleController {
  constructor(private articleService: ArticleService) { }

  // /article/latest?page=1&limit=10
  @Get('latest')
  async getAllArticle(@Query('page') page: number, @Query('limit') limit: number) {
    return await this.articleService.getAllArticle(page, limit);
  }

  // /article/featured?limit=5
  @Get('featured')
  async getArticleByRecommend(@Query('page') page: number, @Query('limit') limit: number) {
    return await this.articleService.getArticleByRecommend(page, limit);
  }

  // 找出最新的指定分类的文章
  // /article/topic?topic=&page=1&limit=6
  @Get('topic')
  async getArticleByTopic(@Query('topic') topic: string, @Query('page') page: number, @Query('limit') limit: number) {
    return await this.articleService.getArticleByTopic(topic, page, limit);
  }

  // /article/count
  @Get('count')
  async getArticleCount() {
    return await this.articleService.getArticleCount();
  }

  // /article?website=https://darmau.design&page=1&limit=10
  @Get()
  async getArticleByBlog(@Query('website') url: string, @Query('page') page: number, @Query('limit') limit: number) {
    return await this.articleService.getArticleByBlog(url, page, limit);
  }

  // /article/add POST
  @UseGuards(AuthGuard)
  @Post('add')
  async addArticle(@Body() addArticleDto: AddArticleDto) {
    return await this.articleService.addArticle(
      addArticleDto.url,
      addArticleDto.website_id,
      addArticleDto.website,
      addArticleDto.title,
      addArticleDto.description,
      addArticleDto.publish_date,
      addArticleDto.author,
      addArticleDto.token
    );
  }

  // /article/block?id=
  @UseGuards(AuthGuard)
  @Put('block')
  async blockArticle(@Query('id') id: string) {
    return await this.articleService.blockArticle(id);
  }

  // /article/view?id=
  @Put('view')
  async addViewCount(@Query('id') id: string) {
    return await this.articleService.addPageView(id);
  }

  // /article/feature?url= PUT
  @UseGuards(AuthGuard)
  @Put('feature')
  async featureArticle(@Query('id') id: string) {
    return await this.articleService.setFeaturedArticle(id);
  }
}
