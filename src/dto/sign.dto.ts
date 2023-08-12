import { IsNotEmpty, IsString } from "class-validator";

export class SignDto {
  @IsNotEmpty()
  @IsString()
  username: string;

  @IsNotEmpty()
  @IsString()
  password: string;

  userId: number;
}
