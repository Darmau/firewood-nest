import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type UserDocument = HydratedDocument<User>;

@Schema()
export class User {
  @Prop()
  username: string;

  @Prop()
  password: string;

  @Prop()
  userId: number;

  // role分为admin和visitor两种
  @Prop({
    enum: ['admin', 'visitor'],
  })
  role: string;
}

export const UserSchema = SchemaFactory.createForClass(User);