import { IsNotEmpty, IsString } from 'class-validator';

export class CreateMessageDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsNotEmpty()
  groupId: string;
}

export class GetMessagesDto {
  limit?: number;
  before?: number; // timestamp
}
