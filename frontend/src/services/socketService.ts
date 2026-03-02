import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NODE_ENV === 'production'
  ? window.location.origin
  : 'http://localhost:3001';

interface SocketGroup {
  id: string;
  name: string;
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

  joinRoom(userId: string, userName: string, group: SocketGroup, fcmToken?: string): void {
    if (this.socket) {
      this.socket.emit('join', { userId, userName, group, fcmToken });
    }
  }

  sendMessage(message: {
    id: string;
    senderId: string;
    senderName: string;
    content: string;
    timestamp: number;
    group: SocketGroup;
  }): void {
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
}

export const socketService = new SocketService();
