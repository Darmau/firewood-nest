import { IsNotEmpty, IsString } from "class-validator";

export class AddWebsiteDto {
  @IsString()
  @IsNotEmpty()
  url: string;

  @IsString()
  @IsNotEmpty()
  name: string;
}
