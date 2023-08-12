import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AuthModule } from "./auth/auth.module";
import { BlogModule } from "./blog/blog.module";
import { UsersModule } from "./users/users.module";
import { ScheduleModule } from "@nestjs/schedule";
import { AutoModule } from "./auto/auto.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env.development", ".env.production"],
    }),
    MongooseModule.forRoot(process.env.MONGODB),
    AuthModule,
    ScheduleModule.forRoot(),
    UsersModule,
    BlogModule,
    AutoModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
