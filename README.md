# Chat App với PostgreSQL

## Yêu cầu

- Node.js >= 18
- PostgreSQL >= 14

## Cài đặt

### 1. Database

Tạo database PostgreSQL:

```sql
CREATE DATABASE chat_app;
```

### 2. Backend

```bash
cd backend

# Cài đặt dependencies
npm install

# Tạo file .env từ mẫu
cp .env.example .env

# Chỉnh sửa .env với thông tin database của bạn
# DB_HOST=localhost
# DB_PORT=5432
# DB_USERNAME=postgres
# DB_PASSWORD=your_password
# DB_NAME=chat_app
# JWT_SECRET=your-secret-key

# Chạy development server
npm run dev
```

Backend sẽ chạy tại: http://localhost:3001

### 3. Frontend

```bash
cd frontend

# Cài đặt dependencies
npm install

# Chạy development server
npm start
```

Frontend sẽ chạy tại: http://localhost:1234

## Tính năng

### Hai phương thức đăng nhập:

1. **User tạm thời (Guest)**:
   - Chỉ cần nhập tên
   - Có thể tham gia nhóm qua link mời
   - Có thể tạo nhóm mới
   - Không lưu trữ danh sách nhóm khi đăng xuất

2. **User đăng ký**:
   - Đăng ký với email và mật khẩu
   - Lưu trữ danh sách nhóm đã tham gia
   - Xem lại lịch sử tin nhắn
   - Đầy đủ tính năng

### Tính năng chính:

- Tạo nhóm chat
- Tham gia nhóm qua mã mời hoặc link URL
- Chat realtime với WebSocket
- Thông báo push (FCM)
- Hiển thị người đang online
- Hiển thị người đang typing

## API Endpoints

### Auth
- `POST /api/auth/register` - Đăng ký
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/temporary` - Tạo user tạm thời
- `GET /api/auth/me` - Lấy thông tin user hiện tại

### Groups
- `POST /api/groups` - Tạo nhóm mới
- `POST /api/groups/join` - Tham gia nhóm bằng mã mời
- `GET /api/groups/my` - Lấy danh sách nhóm của user
- `GET /api/groups/:id` - Lấy thông tin nhóm
- `GET /api/groups/invite/:inviteCode` - Lấy thông tin nhóm từ mã mời
- `DELETE /api/groups/:id/leave` - Rời nhóm

### Messages
- `GET /api/messages/group/:groupId` - Lấy tin nhắn của nhóm

## WebSocket Events

### Client -> Server
- `join` - Tham gia phòng chat
- `sendMessage` - Gửi tin nhắn
- `typing` - Đang nhập
- `leaveRoom` - Rời phòng

### Server -> Client
- `newMessage` - Tin nhắn mới
- `onlineUsers` - Danh sách người online
- `userJoined` - User mới tham gia
- `userLeft` - User rời đi
- `userTyping` - User đang nhập

## Cấu trúc thư mục

```
backend/
├── src/
│   ├── auth/          # Authentication module
│   ├── chat/          # WebSocket gateway
│   ├── entities/      # TypeORM entities
│   ├── group/         # Group module
│   ├── message/       # Message module
│   └── notification/  # Push notification service

frontend/
├── src/
│   ├── components/    # React components
│   ├── contexts/      # React contexts
│   ├── hooks/         # Custom hooks
│   ├── pages/         # Page components
│   ├── services/      # API và Socket services
│   └── types/         # TypeScript types
```



Luồng hoạt động đầy đủ của Socket
┌─────────────────────────────────────────────────────────────────────────────┐
│                    TỔNG QUAN SOCKET FLOW                                     │
└─────────────────────────────────────────────────────────────────────────────┘

 FRONTEND                                              BACKEND (NestJS Gateway)
 ────────                                              ─────────────────────────

 1️⃣ USER VÀO CHAT PAGE
 ┌─────────────────┐
 │  ChatPage Mount │
 │  - Load group   │
 │  - Load messages│
 └────────┬────────┘
          │
          ▼
 2️⃣ KẾT NỐI SOCKET
 ┌─────────────────┐                              ┌─────────────────┐
 │socketService    │─────── WebSocket ──────────▶│ handleConnection│
 │  .connect()     │                              │ (log client)    │
 └────────┬────────┘                              └─────────────────┘
          │
          ▼
 3️⃣ THAM GIA ROOM
 ┌─────────────────┐                              ┌─────────────────┐
 │ emit('join',{   │─────── 'join' ────────────▶│ @handleJoin()   │
 │  userId,        │                              │ - Save to       │
 │  userName,      │                              │   onlineUsers   │
 │  group,         │                              │ - client.join() │
 │  fcmToken       │                              │ - Notify room   │
 │ })              │                              │                 │
 └────────┬────────┘                              └────────┬────────┘
          │                                                │
          │                                                ▼
          │                                       ┌─────────────────┐
          │◀──────── 'onlineUsers' ───────────────│ emit to room    │
          │                                       └─────────────────┘
          ▼
 ┌─────────────────┐
 │ setOnlineUsers  │
 │ (update UI)     │
 └─────────────────┘

 4️⃣ GỬI TIN NHẮN
 ┌─────────────────┐                              ┌─────────────────┐
 │ emit('send      │─────── 'sendMessage' ──────▶│ @handleMessage  │
 │   Message',{    │                              │ - Save to DB    │
 │  id, senderId,  │                              │ - Broadcast     │
 │  content,       │                              │ - Push notif    │
 │  group, ...     │                              │                 │
 │ })              │                              └────────┬────────┘
 └────────┬────────┘                                       │
          │                                                ▼
          │◀──────── 'newMessage' ─────────────── emit to room
          ▼
 ┌─────────────────┐
 │ setMessages     │
 │ (append)        │
 └─────────────────┘

 5️⃣ TYPING INDICATOR
 ┌─────────────────┐                              ┌─────────────────┐
 │ emit('typing',{ │─────── 'typing' ───────────▶│ @handleTyping   │
 │  roomId,userId, │                              │ - Broadcast to  │
 │  isTyping       │                              │   room          │
 │ })              │                              └────────┬────────┘
 └────────┬────────┘                                       │
          │                                                ▼
          │◀──────── 'userTyping' ────────────── emit to others
          ▼
 ┌─────────────────┐
 │ setTypingUsers  │
 └─────────────────┘

 6️⃣ RỜI ROOM
 ┌─────────────────┐                              ┌─────────────────┐
 │ emit('leaveRoom'│─────── 'leaveRoom' ────────▶│ @handleLeaveRoom│
 │  { roomId,      │                              │ - client.leave()│
 │    userId })    │                              │ - Notify others │
 └────────┬────────┘                              └────────┬────────┘
          │                                                │
          │◀──────── 'userLeft' ─────────────────────────┘
          ▼
 ┌─────────────────┐
 │ Update UI       │
 └─────────────────┘

 7️⃣ DISCONNECT
 ┌─────────────────┐                              ┌─────────────────┐
 │ Page unmount /  │─────── disconnect ─────────▶│ handleDisconnect│
 │ Browser close   │                              │ - Remove from   │
 │                 │                              │   onlineUsers   │
 └─────────────────┘                              │ - Notify rooms  │
                                                  └─────────────────┘