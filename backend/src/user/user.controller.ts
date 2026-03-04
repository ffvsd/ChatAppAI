import { 
  Body,
  Controller, 
  Post, 
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @Post('getUserByName')
  @UseGuards(JwtAuthGuard)
  async getUserByName(
    @Body('name') name: string,
  ) {

    return this.userService.getUserByName(name);
  }
}
