import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Post,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import {WebsiteService} from "@/blog/website/website.service";
import {AddWebsiteDto} from "@/dto/addWebsite.dto";
import {UpdateWebsiteDto} from "@/dto/updateWebsite.dto";
import {AuthGuard} from "@/auth/auth.guard";
import {ArticleService} from "@/blog/article/article.service";
import {Website} from "@/schemas/website.schema";
import {PositiveIntPipe} from "@/pipe/positiveInt.pipe";
import {CACHE_MANAGER} from "@nestjs/cache-manager";
import {Cache} from "cache-manager";

@Controller("website")
export class WebsiteController {
  constructor(
      @Inject(CACHE_MANAGER) private cacheManager: Cache,
      private websiteService: WebsiteService,
      private articleService: ArticleService,
  ) {
  }

  // /website/most-view?page=1&limit=10
  @Get("most-view")
  async getWebsiteByPageView(
      @Query("page", PositiveIntPipe) page: number = 1,
      @Query("limit", PositiveIntPipe) limit: number = 15,
  ) {
    const websitesFromCache = await this.cacheManager.get(`/website/most-view?page=${page}&limit=${limit}`);
    if (websitesFromCache) {
      return websitesFromCache;
    }
    const websites = await this.websiteService.getWebsiteByPageView(page, limit);
    await this.cacheManager.set(`/website/most-view?page=${page}&limit=${limit}`, websites, 0);
    return websites;
  }

  // /website/latest?page=1&limit=15
  @Get("latest")
  async getWebsiteByLastPublish(
      @Query("page", PositiveIntPipe) page: number = 1,
      @Query("limit", PositiveIntPipe) limit: number = 15,
  ) {
    const websitesFromCache = await this.cacheManager.get(`/website/latest?page=${page}&limit=${limit}`);
    if (websitesFromCache) {
      return websitesFromCache;
    }
    const websites = await this.websiteService.getWebsiteByLastPublish(page, limit);
    await this.cacheManager.set(`/website/latest?page=${page}&limit=${limit}`, websites, 0);
    return websites;
  }

  // /website/all?page=1&limit=15
  @Get("all")
  async getAllWebsite(
      @Query("page", PositiveIntPipe) page: number = 1,
      @Query("limit", PositiveIntPipe) limit: number = 15
  ) {
    return await this.websiteService.getAllWebsite(page, limit);
  }

  // /website/error?page=1&limit=15
  @Get("error")
  async getWebsiteByErrorCount(
      @Query("page", PositiveIntPipe) page: number = 1,
      @Query("limit", PositiveIntPipe) limit: number = 15
  ) {
    return await this.websiteService.getWebsiteByErrorCount(page, limit);
  }

  // /website/count
  @Get("count")
  async getWebsiteCount() {
    return await this.websiteService.getWebsiteCount();
  }

  // /website?id=
  @Get()
  async getWebsiteById(@Query("id") id: string) {
    const websiteFromCache = await this.cacheManager.get(`/website?id=${id}`);
    if (websiteFromCache) {
      return websiteFromCache;
    }
    const website = await this.websiteService.getWebsiteById(id);
    await this.cacheManager.set(`/website?id=${id}`, website, 0);
    return website;
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
    const websiteFromCache = await this.cacheManager.get(`/website/blog?url=${httpsUrl}`);
    if (websiteFromCache) {
      return websiteFromCache;
    }
    const website = await this.websiteService.getWebsiteByUrl(httpsUrl);
    if (website) {
      await this.cacheManager.set(`/website/blog?url=${httpsUrl}`, website, 0);
      return website;
    } else {
      const websiteFromCache = await this.cacheManager.get(`/website/blog?url=${httpUrl}`);
      if (websiteFromCache) {
        return websiteFromCache;
      }
      const website = await this.websiteService.getWebsiteByUrl(httpUrl);
      await this.cacheManager.set(`/website/blog?url=${httpUrl}`, website, 0);
      return website;
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
    const websiteFromCache = await this.cacheManager.get(`/website/last-year?id=${id}`);
    if (websiteFromCache) {
      return websiteFromCache;
    }
    const website = await this.websiteService.getLastYearArticleCount(id);
    await this.cacheManager.set(`/website/last-year?id=${id}`, website, 0);
    return website;
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
