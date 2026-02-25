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

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'chat_app',
      entities: [User, Group, Message, GroupMember],
      synchronize: true, // Only for development! Use migrations in production
      logging: false,
    }),
    ChatModule,
    AuthModule,
    GroupModule,
    MessageModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
