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

  constructor(
    private notificationService: NotificationService,
    private messageService: MessageService,
    private groupService: GroupService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    
    // Remove user from online users map
    for (const [id, user] of this.onlineUsers.entries()) {
      if (user.socketId === client.id) {
        this.onlineUsers.delete(id);
        
        // Notify all rooms this user was in
        for (const [roomId, members] of this.rooms.entries()) {
          if (members.has(id)) {
            members.delete(id);
            this.server.to(roomId).emit('userLeft', { userId: id, userName: user.name });
            this.emitOnlineUsersToRoom(roomId);
          }
        }
        break;
      }
    }
  }

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
    
    // Store online user info
    this.onlineUsers.set(userId, {
      id: userId,
      name: userName,
      socketId: client.id,
      fcmToken,
    });

    console.log('user online:', this.onlineUsers);

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

    // Notify others in room
    client.to(group.id).emit('userJoined', { userId, userName });
    
    // Send online users list to room
    this.emitOnlineUsersToRoom(group.id);
    
    console.log(`${userName} joined room ${group.id}`);
    
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
