import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BlogModule } from 'src/blog/blog.module';
import { WebsiteSchema } from 'src/schemas/website.schema';
import { AutoService } from './auto.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'Website', schema: WebsiteSchema }]), BlogModule],
  providers: [AutoService],
  controllers: []
})
export class AutoModule { }
