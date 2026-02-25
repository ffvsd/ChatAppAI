export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: number;
  group: Group;
}

export interface User {
  id: string;
  name: string;
}

export interface Group {
  id: string;
  name: string;
}

export interface StorageMessageByEachGroup {
  group: Group;
  messages: Message[];
}

export interface StorageMessages {
  data: StorageMessageByEachGroup[];
}

const MESSAGES_KEY = 'chat_messages';
const USER_KEY = 'chat_user';

export const storageService = {
  // Messages

  getMessageGroupDefault(): StorageMessageByEachGroup | null {
    const allMessages = localStorage.getItem(MESSAGES_KEY);
    if (!allMessages) return null;
    const parsed: StorageMessages = JSON.parse(allMessages);
    return parsed.data.length > 0 ? parsed.data[parsed.data.length - 1] : null;
  },

  getMessagesByGroup(roomId: string): Message[] {
    const allMessages = localStorage.getItem(MESSAGES_KEY);
    if (!allMessages) return [];
    
    const parsed: StorageMessages = JSON.parse(allMessages);
    const group = parsed.data?.find((g: StorageMessageByEachGroup) => g.group.id === roomId);
    return group ? group.messages : [];
  },

  saveMessage(groupChat: Group, message: Message): void {
    console.log('Saving message to storage:', message, 'for group:', groupChat);
    const allMessages = localStorage.getItem(MESSAGES_KEY);
    const parsed = allMessages ? JSON.parse(allMessages) : { data: [] };
    
    let group = parsed.data.find((g: StorageMessageByEachGroup) => g.group.id === groupChat.id);
    if (!group) {
      group = { group: groupChat, messages: [] };
      parsed.data.push(group);
    }
    
    // Check if message already exists
    const exists = group.messages.some((m: Message) => m.id === message.id);
    if (!exists) {
      group.messages.push(message);
      localStorage.setItem(MESSAGES_KEY, JSON.stringify(parsed));
    }
  },

  clearMessages(roomId: string): void {
    const allMessages = localStorage.getItem(MESSAGES_KEY);
    if (!allMessages) return;
    
    const parsed = JSON.parse(allMessages);
    parsed.data = parsed.data.filter((g: StorageMessageByEachGroup) => g.group.id !== roomId);
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(parsed));
  },

  clearAllMessages(): void {
    localStorage.removeItem(MESSAGES_KEY);
  },

  // User
  getUser(): User | null {
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  },

  saveUser(user: User): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  clearUser(): void {
    localStorage.removeItem(USER_KEY);
  },
};
