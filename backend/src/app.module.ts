import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatModule } from './chat/chat.module';
import { AuthModule } from './auth/auth.module';
import { GroupModule } from './group/group.module';
import { MessageModule } from './message/message.module';
import { User } from './entities/user.entity';
import { Group } from './entities/group.entity';
import { Message } from './entities/message.entity';
import { GroupMember } from './entities/group-member.entity';
import { UserModule } from './user/user.module';
import { PrivateMessage } from './entities/private-message.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot(require('./ormconfig').default),
    ChatModule,
    AuthModule,
    GroupModule,
    MessageModule,
    UserModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
