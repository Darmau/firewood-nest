import {
  Body,
  Controller,
  Get, Inject, Logger,
  Post,
  Put,
  Query,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import {AuthGuard} from "@/auth/auth.guard";
import {AddArticleDto} from "@/dto/addArticle.dto";
import {ArticleService} from "@/blog/article/article.service";
import {GetArticleCountDto} from "@/dto/getArticleCount.dto";
import {PositiveIntPipe} from "@/pipe/positiveInt.pipe";
import {CacheInterceptor} from "@nestjs/cache-manager";
import {CACHE_MANAGER} from "@nestjs/cache-manager";
import {Cache} from "cache-manager";
import {CacheTTL} from "@nestjs/common/cache";

@Controller("article")
@UseInterceptors(CacheInterceptor)
export class ArticleController {
  constructor(
      @Inject(CACHE_MANAGER) private cacheManager: Cache,
      private articleService: ArticleService
  ) {
  }

  private logger = new Logger('ArticleController');

  // /article/latest?page=1&limit=10
  @Get("latest")
  async getAllUnblockedArticle(
      @Query("page", PositiveIntPipe) page: number = 1,
      @Query("limit", PositiveIntPipe) limit: number = 15,
  ) {
    return await this.articleService.getAllUnblockedArticle(page, limit);
  }

  // /article/all?page=1&limit=10
  @Get("all")
  @CacheTTL(15)
  async getAllArticle(
      @Query("page", PositiveIntPipe) page: number = 1,
      @Query("limit", PositiveIntPipe) limit: number = 15,
  ) {
    return await this.articleService.getAllArticle(page, limit);
  }

  // /article/featured?page=&limit=5
  @Get("featured")
  async getArticleByRecommend(
      @Query("page", PositiveIntPipe) page: number = 1,
      @Query("limit", PositiveIntPipe) limit: number = 15,
  ) {
    return await this.articleService.getArticleByRecommend(page, limit);
  }

  // 找出最新的指定分类的文章
  // /article/topic?topic=&page=1&limit=6
  @Get("topic")
  async getArticleByTopic(
      @Query("topic") topic: string,
      @Query("page", PositiveIntPipe) page: number = 1,
      @Query("limit", PositiveIntPipe) limit: number = 15,
  ) {
    return await this.articleService.getArticleByTopic(topic, page, limit);
  }

  // /article/count
  @Post("count")
  async getArticleCount(@Body() getArticleCount: GetArticleCountDto) {
    return await this.articleService.getArticleCount(
        getArticleCount.type,
        getArticleCount.topic,
        getArticleCount.startAt,
        getArticleCount.endAt,
    );
  }

  // /article?website=https://darmau.design&page=1&limit=10
  @Get()
  async getArticleByBlog(
      @Query("website") url: string,
      @Query("page", PositiveIntPipe) page: number = 1,
      @Query("limit", PositiveIntPipe) limit: number = 15,
  ) {
    return await this.articleService.getArticleByBlog(url, page, limit);
  }

  @Get("article-count")
  async getArticleCountByBlog(@Query("id") id: string) {
    return await this.articleService.getArticleCountByBlog(id);
  }

  // /article/add POST
  @UseGuards(AuthGuard)
  @Post("add")
  async addArticle(@Body() addArticleDto: AddArticleDto) {
    return await this.articleService.addArticle(
        addArticleDto.url,
        addArticleDto.website_id,
        addArticleDto.website,
        addArticleDto.title,
        addArticleDto.description,
        addArticleDto.publish_date,
        addArticleDto.author,
    );
  }

  // /article/block?id=
  @UseGuards(AuthGuard)
  @Put("block")
  async blockArticle(@Query("id") id: string) {
    await this.cacheManager.reset();
    this.logger.debug('Cache reset');
    return await this.articleService.blockArticle(id);
  }

  // /article/view?id=
  @Put("view")
  async addViewCount(@Query("id") id: string) {
    return await this.articleService.addPageView(id);
  }

  // /article/feature?id= PUT
  @UseGuards(AuthGuard)
  @Put("feature")
  async featureArticle(@Query("id") id: string) {
    await this.cacheManager.reset();
    this.logger.debug('Cache reset');
    return await this.articleService.setFeaturedArticle(id);
  }

  // /article/edit?id=&topic= PUT
  @UseGuards(AuthGuard)
  @Put("edit")
  async editArticleTopic(
      @Query("id") id: string,
      @Query("topic") topic: string,
  ) {
    return await this.articleService.editArticleTopic(id, topic);
  }

  // /article/hottest?limit=10
  // 获取一周范围内最热门的文章
  @Get("hottest")
  async getHotestArticle(@Query("limit", PositiveIntPipe) limit: number = 10) {
    return await this.articleService.getHotestArticle(limit);
  }

  // /article/random
  @Get("random")
  @CacheTTL(3)
  async getRandomArticle() {
    return await this.articleService.getRandomArticle();
  }

  // /article/random-many
  @Get("random-many")
  @CacheTTL(60)
  async getManyRandomArticle() {
    return await this.articleService.getManyRandomArticle();
  }
}
