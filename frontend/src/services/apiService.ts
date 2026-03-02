// Đọc từ env, mặc định localhost cho development
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001/api';

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

class ApiService {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('auth_token');
    }
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'An error occurred' }));
      throw new Error(error.message || 'An error occurred');
    }

    return response.json();
  }

  // Auth endpoints
  async register(email: string, password: string, displayName: string) {
    const result = await this.request<{ user: any; accessToken: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, displayName }),
    });
    this.setToken(result.accessToken);
    return result;
  }

  async login(email: string, password: string) {
    const result = await this.request<{ user: any; accessToken: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(result.accessToken);
    return result;
  }

  async createTemporaryUser(displayName: string, fcmToken?: string) {
    const result = await this.request<{ user: any; accessToken: string }>('/auth/temporary', {
      method: 'POST',
      body: JSON.stringify({ displayName, fcmToken }),
    });
    this.setToken(result.accessToken);
    return result;
  }

  async getMe() {
    return this.request<any>('/auth/me');
  }

  async updateFcmToken(fcmToken: string) {
    return this.request('/auth/fcm-token', {
      method: 'POST',
      body: JSON.stringify({ fcmToken }),
    });
  }

  // Group endpoints
  async createGroup(name: string, description?: string) {
    return this.request<any>('/groups', {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    });
  }

  async joinGroup(inviteCode: string) {
    return this.request<any>('/groups/join', {
      method: 'POST',
      body: JSON.stringify({ inviteCode }),
    });
  }

  async getGroupByInviteCode(inviteCode: string) {
    return this.request<any>(`/groups/invite/${inviteCode}`);
  }

  async getMyGroups() {
    return this.request<any[]>('/groups/my');
  }

  async getGroup(groupId: string) {
    return this.request<any>(`/groups/${groupId}`);
  }

  async getGroupMembers(groupId: string) {
    return this.request<any[]>(`/groups/${groupId}/members`);
  }

  async leaveGroup(groupId: string) {
    return this.request(`/groups/${groupId}/leave`, {
      method: 'DELETE',
    });
  }

  // Message endpoints
  async getGroupMessages(groupId: string, limit?: number, before?: number) {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (before) params.append('before', before.toString());
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<any[]>(`/messages/group/${groupId}${query}`);
  }

  // Utility
  logout() {
    this.setToken(null);
    localStorage.removeItem('chat_user');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}

export const apiService = new ApiService();
