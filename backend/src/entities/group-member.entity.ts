import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from './user.entity';
import { Group } from './group.entity';

export enum MemberRole {
  ADMIN = 'admin',
  MEMBER = 'member',
}

@Entity('group_members')
@Unique(['userId', 'groupId'])
export class GroupMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, (user) => user.groupMemberships)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  groupId: string;

  @ManyToOne(() => Group, (group) => group.members)
  @JoinColumn({ name: 'groupId' })
  group: Group;

  @Column({
    type: 'enum',
    enum: MemberRole,
    default: MemberRole.MEMBER,
  })
  role: MemberRole;

  @CreateDateColumn()
  joinedAt: Date;
}
