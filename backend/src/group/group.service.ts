import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Group, GroupType } from '../entities/group.entity';
import { GroupMember, MemberRole } from '../entities/group-member.entity';
import { User, UserType } from '../entities/user.entity';
import { CreateGroupDto } from './dto/group.dto';
import { v4 as uuid } from 'uuid';

@Injectable()
export class GroupService {
  constructor(
    @InjectRepository(Group)
    private groupRepository: Repository<Group>,
    @InjectRepository(GroupMember)
    private groupMemberRepository: Repository<GroupMember>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async createGroup(userId: string, dto: CreateGroupDto): Promise<Group> {
    const inviteCode = this.generateInviteCode();

    const group = this.groupRepository.create({
      name: dto.name,
      description: dto.description,
      type: dto.type || GroupType.GROUP,
      inviteCode,
      createdById: userId,
    });

    await this.groupRepository.save(group);

    // Add creator as admin
    const membership = this.groupMemberRepository.create({
      userId,
      groupId: group.id,
      role: MemberRole.ADMIN,
    });
    await this.groupMemberRepository.save(membership);

    return group;
  }

  async joinGroup(userId: string, inviteCode: string): Promise<Group> {
    const group = await this.groupRepository.findOne({ 
      where: { inviteCode, isActive: true } 
    });

    if (!group) {
      throw new NotFoundException('Group not found or invalid invite code');
    }

    // Check if already a member
    const existingMembership = await this.groupMemberRepository.findOne({
      where: { userId, groupId: group.id },
    });

    if (existingMembership) {
      return group; // Already a member, return the group
    }

    // Add as member
    const membership = this.groupMemberRepository.create({
      userId,
      groupId: group.id,
      role: MemberRole.MEMBER,
    });
    await this.groupMemberRepository.save(membership);

    return group;
  }

  async getGroupByInviteCode(inviteCode: string): Promise<Group | null> {
    return this.groupRepository.findOne({
      where: { inviteCode, isActive: true },
      relations: ['members', 'members.user'],
    });
  }

  async getGroupById(groupId: string): Promise<Group | null> {
    return this.groupRepository.findOne({
      where: { id: groupId, isActive: true },
      relations: ['members', 'members.user'],
    });
  }

  async getUserGroups(userId: string): Promise<Group[]> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    
    // Temporary users don't have saved groups
    if (user?.userType === UserType.TEMPORARY) {
      return [];
    }

    const memberships = await this.groupMemberRepository.find({
      where: { userId },
      relations: ['group', 'group.members', 'group.members.user'],
    });

    return memberships
      .filter(m => m.group?.isActive)
      .map(m => m.group);
  }

  async getGroupMembers(groupId: string): Promise<GroupMember[]> {
    return this.groupMemberRepository.find({
      where: { groupId },
      relations: ['user'],
    });
  }

  async leaveGroup(userId: string, groupId: string): Promise<void> {
    const membership = await this.groupMemberRepository.findOne({
      where: { userId, groupId },
    });

    if (!membership) {
      throw new NotFoundException('You are not a member of this group');
    }

    await this.groupMemberRepository.remove(membership);
  }

  async isGroupMember(userId: string, groupId: string): Promise<boolean> {
    const membership = await this.groupMemberRepository.findOne({
      where: { userId, groupId },
    });
    return !!membership;
  }

  private generateInviteCode(): string {
    // Generate a short, URL-safe invite code
    return uuid().replace(/-/g, '').substring(0, 12);
  }
}
