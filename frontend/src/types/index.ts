export enum UserType {
  REGISTERED = 'registered',
  TEMPORARY = 'temporary',
}

export interface User {
  id: string;
  email?: string;
  displayName: string;
  userType: UserType;
  isActive?: boolean;
  createdAt?: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  inviteCode: string;
  type: 'direct' | 'group';
  createdById?: string;
  memberCount?: number;
  members?: GroupMember[];
  isActive?: boolean;
  createdAt?: string;
}

export interface GroupMember {
  id: string;
  userId: string;
  groupId: string;
  role: 'admin' | 'member';
  user?: User;
  joinedAt?: string;
}

export interface Message {
  id: string;
  content: string;
  senderId: string;
  senderName?: string;
  groupId: string;
  timestamp: number;
  createdAt?: string;
  sender?: User;
  group?: {
    id: string;
    name: string;
  };
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
