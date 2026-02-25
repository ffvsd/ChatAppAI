import { 
  Controller, 
  Get, 
  Param, 
  Query,
  UseGuards,
} from '@nestjs/common';
import { MessageService } from './message.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('messages')
export class MessageController {
  constructor(private messageService: MessageService) {}

  @Get('group/:groupId')
  @UseGuards(JwtAuthGuard)
  async getGroupMessages(
    @Param('groupId') groupId: string,
    @Query('limit') limit?: string,
    @Query('before') before?: string,
  ) {
    return this.messageService.getGroupMessages(
      groupId,
      limit ? parseInt(limit, 10) : 50,
      before ? parseInt(before, 10) : undefined,
    );
  }
}
