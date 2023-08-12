import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { User } from "../schemas/user.schema";
const bcrypt = require("bcrypt");

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    @InjectModel("User") private userModel: Model<User>,
  ) {}

  async signIn(username: string, password: string) {
    const user = await this.userModel.findOne({ username: username }).exec();
    const hashPassword = await user.password;
    const isMatch = await bcrypt.compare(password, hashPassword);
    if (!isMatch) throw new UnauthorizedException("Invalid password");
    const payLoad = { username: user.username, sub: user.userId };
    return {
      access_token: this.jwtService.sign(payLoad),
    };
  }

  async signUp(username: string, pass: string) {
    const admin = await this.userModel.find();
    if (admin.length > 0) {
      const error = {
        message: "Admin already exists",
        hasAdmin: true,
      };
      throw new UnauthorizedException(error);
    }
    try {
      // 生成加盐的密码
      bcrypt.hash(pass, 10, async (err, hash) => {
        if (err) {
          console.error(err);
          throw new UnauthorizedException();
        }
        const newUser = await new this.userModel({
          username: username,
          password: hash,
          userId: 1,
        });
        await newUser.save();
      });
      return {
        message: "success",
      };
    } catch (err) {
      console.error(err);
      throw new UnauthorizedException("Register failed");
    }
  }

  // 检测access_token是否有效
  async validate() {
    return {
      message: "success",
    };
  }
}
