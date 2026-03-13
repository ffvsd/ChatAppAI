import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { NotificationService } from '../notification/notification.service';
import { MessageService } from '../message/message.service';
import { GroupService } from '../group/group.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';

interface SocketMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: number;
  group: {
    id: string;
    name: string;
  };
}

interface PrivateMessage {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  content: string;
  timestamp: number;
}

interface OnlineUserInfo {
  id: string;
  name: string;
  socketId: string;
  fcmToken?: string;
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private onlineUsers: Map<string, OnlineUserInfo> = new Map();
  private rooms: Map<string, Set<string>> = new Map();

  private privateConversations: Map<string, Set<string>> = new Map();
  private getPrivateConversationId(userId1: string, userId2: string): string {
    const sortedIds = [userId1, userId2].sort();
    return `private_${sortedIds[0]}_${sortedIds[1]}`;
  }

  constructor(
    private notificationService: NotificationService,
    private messageService: MessageService,
    private groupService: GroupService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    const userName = client.handshake.query.userName as string;
    const fcmToken = client.handshake.query.fcmToken as string | undefined;

    if (!userId || !userName) {
      client.disconnect();
      return;
    }

    const listGroup = await this.groupService.getUserGroups(userId);

    this.onlineUsers.set(userId, {
      id: userId,
      name: userName,
      socketId: client.id,
      fcmToken: fcmToken as string | undefined,
    });

    if (listGroup) {
      const groupIds = listGroup.map(group => group.id).join(',');
      const groups = (groupIds as string).split(',');
      for (const groupId of groups) {
        client.join(groupId);
        if (!this.rooms.has(groupId)) this.rooms.set(groupId, new Set());
        this.rooms.get(groupId)!.add(userId);
        this.emitOnlineUsersToRoom(groupId);
      }
    }
  }

  handleDisconnect(client: Socket) {
    
    // Remove user from online users map
    for (const [id, user] of this.onlineUsers.entries()) {
      if (user.socketId === client.id) {
        this.onlineUsers.delete(id);
      
        // Notify all rooms this user was in
        for (const [roomId, members] of this.rooms.entries()) {
          if (members.has(id)) {
            members.delete(id);
            this.emitOnlineUsersToRoom(roomId);
          }
        }
        break;
      }
    }
  }

  // Join Private Chat
  @SubscribeMessage('joinPrivateChat')
  async handleJoinPrivateChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: {
      userId: string;
      userName: string;
      receiverId: string;
      
    }
  ) {
    const { userId, userName, receiverId } = data;
    const conversationId = this.getPrivateConversationId(userId, receiverId);
    client.join(conversationId);

    if (!this.privateConversations.has(conversationId)) {
      this.privateConversations.set(conversationId, new Set());
    }
    this.privateConversations.get(conversationId)!.add(userId);

    return { success: true, conversationId };
  }

  // Send Private Message
  @SubscribeMessage('sendPrivateMessage')
  async handleSendPrivateMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() message: PrivateMessage,
  ) {
    const { senderId, receiverId, content } = message;
    const conversationId = this.getPrivateConversationId(senderId, receiverId);

    // Save private message to database
    try {
      await this.messageService.createPrivateMessage(
        message.id,
        senderId,
        receiverId,
        content,
      );
    } catch (error) {
      console.error('Error saving private message:', error);
    }

    this.server.to(conversationId).emit('newMessage', {
      ...message,
      conversationId,
    });

    return { success: true, conversationId };
  }

  // Type Private Message
  @SubscribeMessage('typingPrivate')
  handleTypingPrivate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { 
      senderId: string;
      receiverId: string;
      senderName: string;
      isTyping: boolean;
    }, 
  ) {
    const conversationId = this.getPrivateConversationId(data.senderId, data.receiverId);
    client.to(conversationId).emit('userTypingPrivate', {
      senderId: data.senderId,
      senderName: data.senderName,
      isTyping: data.isTyping,
    });
  }


  // Join Group Chat
  @SubscribeMessage('join')
  async handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { 
      userId: string; 
      userName: string; 
      group: { id: string; name: string }; 
      fcmToken?: string 
    },
  ) {
    const { userId, userName, group, fcmToken } = data;

    // Update FCM token in database if provided
    if (fcmToken) {
      await this.userRepository.update(userId, { fcmToken });
    }

    // Join socket room
    client.join(group.id);
    
    // Add user to room tracking
    if (!this.rooms.has(group.id)) {
      this.rooms.set(group.id, new Set());
    }
    this.rooms.get(group.id)!.add(userId);
    
    // Send online users list to room
    this.emitOnlineUsersToRoom(group.id);
    
    return { success: true, message: `Joined room ${group.id}` };
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() message: SocketMessage,
  ) {
    console.log('Message received:', message);

    // Save message to database
    try {
      await this.messageService.createMessage(
        message.senderId,
        message.group.id,
        message.content,
        message.id,
      );
    } catch (error) {
      console.error('Error saving message:', error);
    }

    // Broadcast message to room
    this.server.to(message.group.id).emit('newMessage', message);
    
    // Send push notification to offline/other users in room
    const roomUsers = this.rooms.get(message.group.id) || new Set();
    
    for (const userId of roomUsers) {
      if (userId !== message.senderId) {
        const user = this.onlineUsers.get(userId);
        if (user?.fcmToken) {
          await this.notificationService.sendPushNotification(
            user.fcmToken,
            message.senderName,
            message.content,
          );
        }
      }
    }
    
    return { success: true };
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { 
      roomId: string; 
      userId: string; 
      userName: string; 
      isTyping: boolean 
    },
  ) {
    client.to(data.roomId).emit('userTyping', {
      userId: data.userId,
      userName: data.userName,
      isTyping: data.isTyping,
    });
  }


  // Leave Group Chat - Currently not used
  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; userId: string },
  ) {
    client.leave(data.roomId);
    
    const room = this.rooms.get(data.roomId);
    if (room) {
      room.delete(data.userId);
    }
    
    const user = this.onlineUsers.get(data.userId);
    if (user) {
      client.to(data.roomId).emit('userLeft', {
        userId: data.userId,
        userName: user.name,
      });
      this.emitOnlineUsersToRoom(data.roomId);
    }
  }

  private emitOnlineUsersToRoom(roomId: string) {
    const roomMembers = this.rooms.get(roomId) || new Set();
    const onlineUsers = Array.from(roomMembers)
      .map(userId => this.onlineUsers.get(userId))
      .filter(user => user !== undefined)
      .map(user => ({
        id: user!.id,
        name: user!.name,
      }));
    
    this.server.to(roomId).emit('onlineUsers', onlineUsers);
  }
}
