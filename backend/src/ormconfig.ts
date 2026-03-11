import { DataSourceOptions } from 'typeorm';
import { User } from './entities/user.entity';
import { Group } from './entities/group.entity';
import { Message } from './entities/message.entity';
import { GroupMember } from './entities/group-member.entity';
import { PrivateMessage } from './entities/private-message.entity';
import { Test } from './entities/test.entity';

const ormConfig: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'chat_app',
  entities: [User, Group, Message, GroupMember, PrivateMessage, Test],
  migrations: ['dist/migrations/*.js'],
  synchronize: false, // Luôn false khi dùng migration
  logging: false,
};

export default ormConfig;