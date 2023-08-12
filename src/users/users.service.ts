import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";

export type User = any;

@Injectable()
export class UsersService {
  constructor(@InjectModel("User") private userModel: Model<User>) {}

  async findOne(username: string): Promise<User | undefined> {
    return this.userModel.find({ username: username }).exec();
  }
}
