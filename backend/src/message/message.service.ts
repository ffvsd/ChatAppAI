import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Message } from '../entities/message.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class MessageService {
  constructor(
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async createMessage(
    senderId: string, 
    groupId: string, 
    content: string,
    messageId?: string,
  ): Promise<Message> {
    const sender = await this.userRepository.findOne({ where: { id: senderId } });
    
    const message = this.messageRepository.create({
      id: messageId,
      content,
      senderId,
      groupId,
      timestamp: Date.now(),
    });

    const savedMessage = await this.messageRepository.save(message);
    
    // Return with sender info
    return {
      ...savedMessage,
      sender,
    } as Message;
  }

  async getGroupMessages(
    groupId: string, 
    limit: number = 50, 
    before?: number,
  ): Promise<Message[]> {
    const queryBuilder = this.messageRepository
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.sender', 'sender')
      .where('message.groupId = :groupId', { groupId })
      .orderBy('message.timestamp', 'DESC')
      .take(limit);

    if (before) {
      queryBuilder.andWhere('message.timestamp < :before', { before });
    }

    const messages = await queryBuilder.getMany();
    
    // Return in chronological order
    return messages.reverse();
  }

  async getMessage(messageId: string): Promise<Message | null> {
    return this.messageRepository.findOne({
      where: { id: messageId },
      relations: ['sender'],
    });
  }
}
