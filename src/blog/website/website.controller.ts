import {Body, Controller, Delete, Get, Post, Put, Query, UseGuards,} from "@nestjs/common";
import {WebsiteService} from "./website.service";
import {AddWebsiteDto} from "../../dto/addWebsite.dto";
import {UpdateWebsiteDto} from "../../dto/updateWebsite.dto";
import {AuthGuard} from "../../auth/auth.guard";
import {ArticleService} from "../article/article.service";
import {Website} from "../../schemas/website.schema";

@Controller("website")
export class WebsiteController {
  constructor(
      private websiteService: WebsiteService,
      private articleService: ArticleService,
  ) {
  }

  // /website/most-view?page=1&limit=10
  @Get("most-view")
  async getWebsiteByPageView(
      @Query("page") page: number,
      @Query("limit") limit: number,
  ) {
    return await this.websiteService.getWebsiteByPageView(page, limit);
  }

  // /website/latest?page=1&limit=10
  @Get("latest")
  async getWebsiteByLastPublish(
      @Query("page") page: number,
      @Query("limit") limit: number,
  ) {
    return await this.websiteService.getWebsiteByLastPublish(page, limit);
  }

  // /website/count
  @Get("count")
  async getWebsiteCount() {
    return await this.websiteService.getWebsiteCount();
  }

  // /website?id=
  @Get()
  async getWebsiteByUrl(@Query("id") id: string) {
    return await this.websiteService.getWebsiteById(id);
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
}
