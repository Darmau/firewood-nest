import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import { WebsiteService } from "@/blog/website/website.service";
import { AddWebsiteDto } from "@/dto/addWebsite.dto";
import { UpdateWebsiteDto } from "@/dto/updateWebsite.dto";
import { AuthGuard } from "@/auth/auth.guard";
import { ArticleService } from "@/blog/article/article.service";
import { Website } from "@/schemas/website.schema";
import { PositiveIntPipe } from "@/pipe/positiveInt.pipe";

@Controller("website")
export class WebsiteController {
  constructor(
    private websiteService: WebsiteService,
    private articleService: ArticleService,
  ) {}

  // /website/most-view?page=1&limit=10
  @Get("most-view")
  async getWebsiteByPageView(
    @Query("page", PositiveIntPipe) page: number = 1,
    @Query("limit", PositiveIntPipe) limit: number = 15,
  ) {
    return await this.websiteService.getWebsiteByPageView(page, limit);
  }

  // /website/latest?page=1&limit=10
  @Get("latest")
  async getWebsiteByLastPublish(
    @Query("page", PositiveIntPipe) page: number = 1,
    @Query("limit", PositiveIntPipe) limit: number = 15,
  ) {
    return await this.websiteService.getWebsiteByLastPublish(page, limit);
  }

  // /website/all?page=1&limit=10
  @Get("all")
  async getAllWebsite(
      @Query("page", PositiveIntPipe) page: number = 1,
      @Query("limit", PositiveIntPipe) limit: number = 15
  ) {
    return await this.websiteService.getAllWebsite(page, limit);
  }

  // /website/count
  @Get("count")
  async getWebsiteCount() {
    return await this.websiteService.getWebsiteCount();
  }

  // /website?id=
  @Get()
  async getWebsiteById(@Query("id") id: string) {
    return await this.websiteService.getWebsiteById(id);
  }

  // /website/blog?url=
  // 根据域名查询网站信息
  @Get("blog")
  async getWebsiteByUrl(@Query("url") url: string) {
    // 将传入url之前添加协议名
    const httpsPrefix = "https://";
    const httpPrefix = "http://";
    const httpsUrl = httpsPrefix.concat(url);
    const httpUrl = httpPrefix.concat(url);
    // 获取网站信息
    const website = await this.websiteService.getWebsiteByUrl(httpsUrl);
    if (website) {
      return website;
    } else {
      return await this.websiteService.getWebsiteByUrl(httpUrl);
    }
  }

  // /website/add POST
  // 管理员增加网站
  @UseGuards(AuthGuard)
  @Post("add")
  async addWebsite(@Body() addWebsiteDto: AddWebsiteDto) {
    return await this.websiteService.addWebsite(
      addWebsiteDto.url,
      addWebsiteDto.name,
    );
  }

  // /website?id= PUT
  // 管理员修改网站
  @UseGuards(AuthGuard)
  @Put()
  async updateWebsiteUrl(
    @Query("id") id: string,
    @Body() updateWebsiteDto: UpdateWebsiteDto,
  ) {
    return await this.websiteService.updateWebsite(
      id,
      updateWebsiteDto.url,
      updateWebsiteDto.rss,
      updateWebsiteDto.name,
      updateWebsiteDto.description,
      updateWebsiteDto.cover,
    );
  }

  // /website?id= DELETE
  // 管理员删除网站
  @UseGuards(AuthGuard)
  @Delete()
  async deleteWebsite(@Query("id") id: string) {
    return await this.websiteService.deleteWebsite(id);
  }

  // /website/last-year?id= GET
  // 计算最近一年发布的文章数
  @Get("last-year")
  async getLastYearArticleCount(@Query("id") id: string) {
    return await this.websiteService.getLastYearArticleCount(id);
  }

  // 随机返回6个网站
  @Get("random")
  async getRandomWebsite(): Promise<Website[]> {
    return await this.websiteService.getRandomWebsite();
  }

  // 手动更新开始抓取网站
  @Post("update")
  async updateWebsite(@Query("url") url: string) {
    return await this.articleService.updateArticlesByWebsite(url);
  }
}
