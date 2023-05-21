import { IsDateString, IsNotEmpty, IsOptional, MaxDate } from "class-validator";

export class GetArticleCountDto {
  @IsNotEmpty()
  type: string;

  @IsOptional()
  topic: string;

  @IsOptional()
  @IsDateString()
  startAt: Date;

  // 截止日期不得超过现在
  @IsOptional()
  @IsDateString()
  @MaxDate(new Date())
  endAt: Date;
}