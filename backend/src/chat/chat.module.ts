import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatGateway } from './chat.gateway';
import { NotificationService } from '../notification/notification.service';
import { MessageService } from '../message/message.service';
import { GroupService } from '../group/group.service';
import { User } from '../entities/user.entity';
import { Message } from '../entities/message.entity';
import { Group } from '../entities/group.entity';
import { GroupMember } from '../entities/group-member.entity';
import { PrivateMessage } from '../entities/private-message.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Message, PrivateMessage, Group, GroupMember])],
  providers: [ChatGateway, NotificationService, MessageService, GroupService],
  exports: [ChatGateway],
})
export class ChatModule {}
