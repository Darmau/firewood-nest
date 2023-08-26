import { Module } from "@nestjs/common";
import { AuthController } from "@/auth/auth.controller";
import { AuthService } from "@/auth/auth.service";
import { UsersModule } from "@/users/users.module";
import { JwtModule } from "@nestjs/jwt";
import { MongooseModule } from "@nestjs/mongoose";
import { UserSchema } from "@/schemas/user.schema";
import { jwtConstants } from "@/common/constants";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: "User", schema: UserSchema }]),
    JwtModule.register({
      global: true,
      secret: jwtConstants,
      signOptions: { expiresIn: "14d" },
    }),
    UsersModule,
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
