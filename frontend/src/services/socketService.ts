import { io, Socket } from 'socket.io-client';

// Đọc từ env, mặc định localhost cho development
const SOCKET_URL = process.env.SOCKET_URL || 'http://localhost:3001';

interface SocketGroup {
  id: string;
  name: string;
}

export enum JoinType {
  group = 'group',
  private = 'private'
}

class SocketService {
  private socket: Socket | null = null;

  connect(): Socket {
    if (!this.socket) {
      this.socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      this.socket.on('connect', () => {
        console.log('Connected to server');
      });

      this.socket.on('disconnect', () => {
        console.log('Disconnected from server');
      });

      this.socket.on('connect_error', (error) => {
        console.error('Connection error:', error);
      });
    }

    return this.socket;
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Socket event emitters

  // Group
  joinRoom(userId: string, userName: string, group: SocketGroup, fcmToken?: string): void {
    if (this.socket) {
      this.socket.emit('join', { userId, userName, group, fcmToken });
    }
  }

  sendMessage(message: any): void {
    if (this.socket) {
      this.socket.emit('sendMessage', message);
    }
  }

  sendTyping(roomId: string, userId: string, userName: string, isTyping: boolean): void {
    if (this.socket) {
      this.socket.emit('typing', { roomId, userId, userName, isTyping });
    }
  }

  leaveRoom(roomId: string, userId: string): void {
    if (this.socket) {
      this.socket.emit('leaveRoom', { roomId, userId });
    }
  }

  // Private
  handleJoinPrivateChat(userId: string, userName: string, targetUserId: string, fcmToken?: string): void {
    if (this.socket) {
      console.log('check run handleJoinPrivateChat with:', { userId, userName, targetUserId, fcmToken });
      this.socket.emit('joinPrivateChat', { userId, userName, receiverId: targetUserId });
    }
  }

  sendPrivateMessage(message: any): void {
    if (this.socket) {
      console.log('check sendPrivateMessage with:', message);
      this.socket.emit('sendPrivateMessage', message);
    }
  }

  handlePreJoin(data: any, type: JoinType): void {
    console.log('handlePreJoin called with:', { data, type });
    if (type === JoinType.group) {
      this.joinRoom(data.userId, data.userName, data.group, data.fcmToken);
    } else if (type === JoinType.private) {
      this.handleJoinPrivateChat(data.userId, data.userName, data.targetUserId, data.fcmToken);
    }
  }
}

export const socketService = new SocketService();
