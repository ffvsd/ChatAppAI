import { 
  Controller, 
  Post, 
  Get, 
  Body, 
  Param, 
  UseGuards, 
  Request,
  Delete,
} from '@nestjs/common';
import { GroupService } from './group.service';
import { CreateGroupDto, JoinGroupDto } from './dto/group.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('groups')
export class GroupController {
  constructor(private groupService: GroupService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async createGroup(@Request() req, @Body() dto: CreateGroupDto) {
    return this.groupService.createGroup(req.user.sub, dto);
  }

  @Post('join')
  @UseGuards(JwtAuthGuard)
  async joinGroup(@Request() req, @Body() dto: JoinGroupDto) {
    return this.groupService.joinGroup(req.user.sub, dto.inviteCode);
  }

  @Get('invite/:inviteCode')
  async getGroupByInviteCode(@Param('inviteCode') inviteCode: string) {
    const group = await this.groupService.getGroupByInviteCode(inviteCode);
    if (!group) {
      return { error: 'Group not found' };
    }
    // Return limited info for non-members
    return {
      id: group.id,
      name: group.name,
      description: group.description,
      memberCount: group.members?.length || 0,
    };
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  async getMyGroups(@Request() req) {
    return this.groupService.getUserGroups(req.user.sub);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getGroup(@Request() req, @Param('id') id: string) {
    return this.groupService.getGroupById(id);
  }

  @Get(':id/members')
  @UseGuards(JwtAuthGuard)
  async getGroupMembers(@Param('id') id: string) {
    return this.groupService.getGroupMembers(id);
  }

  @Delete(':id/leave')
  @UseGuards(JwtAuthGuard)
  async leaveGroup(@Request() req, @Param('id') id: string) {
    await this.groupService.leaveGroup(req.user.sub, id);
    return { success: true };
  }
}
