import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SignDto } from 'src/dto/sign.dto';
import { User } from 'src/schemas/user.schema';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    @InjectModel('User') private userModel: Model<User>,
  ) { }

  // /auth/login POST
  @HttpCode(HttpStatus.OK)
  @Post('login')
  signIn(@Body() signDto: SignDto) {
    return this.authService.signIn(signDto.username, signDto.password);
  }

  // /auth/signup POST
  @HttpCode(HttpStatus.CREATED)
  @Post('signup')
  signUp(@Body() signDto: SignDto) {
    return this.authService.signUp(signDto.username, signDto.password);
  }
  
  // /auth/validate GET
  // 检测access_token是否有效
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  @Get('validate')
  validate() {
    return this.authService.validate();
  }
}
