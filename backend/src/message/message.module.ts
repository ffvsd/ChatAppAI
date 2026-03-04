import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessageController } from './message.controller';
import { MessageService } from './message.service';
import { Message } from '../entities/message.entity';
import { User } from '../entities/user.entity';
import { PrivateMessage } from '../entities/private-message.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Message, User, PrivateMessage])],
  controllers: [MessageController],
  providers: [MessageService],
  exports: [MessageService],
})
export class MessageModule {}
