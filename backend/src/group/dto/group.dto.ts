import { IsNotEmpty, IsOptional, IsString, IsEnum } from 'class-validator';
import { GroupType } from '../../entities/group.entity';

export class CreateGroupDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(GroupType)
  @IsOptional()
  type?: GroupType;
}

export class JoinGroupDto {
  @IsString()
  @IsNotEmpty()
  inviteCode: string;
}
