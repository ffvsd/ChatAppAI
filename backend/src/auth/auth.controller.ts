import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, CreateTemporaryUserDto } from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('temporary')
  async createTemporaryUser(@Body() dto: CreateTemporaryUserDto) {
    console.log("BODY:", dto);
    return this.authService.createTemporaryUser(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@Request() req) {
    return this.authService.validateUser(req.user.sub);
  }

  @Post('fcm-token')
  @UseGuards(JwtAuthGuard)
  async updateFcmToken(@Request() req, @Body('fcmToken') fcmToken: string) {
    await this.authService.updateFcmToken(req.user.sub, fcmToken);
    return { success: true };
  }
}
