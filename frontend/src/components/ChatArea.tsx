import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/apiService';
import { socketService, JoinType } from '../services/socketService';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { Group, Message } from '../types';
import { v4 as uuid } from 'uuid';

interface OnlineUser {
  id: string;
  name: string;
}

interface TypingUser {
  userId: string;
  userName: string;
}

interface ChatAreaProps {
    joinType: JoinType;
}

export const ChatArea: React.FC<ChatAreaProps> = ({ joinType }) => {
  const { chatId } = useParams<{ chatId: string }>();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  
  const [group, setGroup] = useState<Group | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [privateChatUser, setPrivateChatUser] = useState<{ id: string; name: string } | null>(null);
  
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasJoined = useRef(false);


  // Load group and messages
  useEffect(() => {

    if (!chatId || !isAuthenticated) return;
    
    // Reset state when groupId changes
    setGroup(null);
    setMessages([]);
    setIsLoading(true);
    setError('');
    hasJoined.current = false;
    
    const loadData = async () => {
      try {
        if (joinType === JoinType.private) {
            const privateData = await apiService.getPrivateMessages(chatId);
            setIsLoading(false);
            setPrivateChatUser({ id: chatId, name: privateData[0]?.receiver?.displayName || 'Unknown' });
            setMessages(privateData);
        } else {
            const groupData = await apiService.getGroup(chatId);
            if (!groupData) {
            setError('Nhóm không tồn tại');
            return;
            }
            setGroup(groupData);

            const messagesData = await apiService.getGroupMessages(chatId);
            setMessages(messagesData.map((m: any) => ({
            ...m,
            senderName: m.sender?.displayName || 'Unknown',
            group: { id: chatId, name: groupData.name },
            })));
        }
        
      } catch (err: any) {
        setError(err.message || 'Không thể tải dữ liệu');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [chatId,  isAuthenticated]);

  // Setup socket connection
  useEffect(() => {
    if((!group && !privateChatUser || !user)) return;
    const socket = socketService.connect();

    // Check if socket is already connected
    if (socket.connected) {
      setIsConnected(true);
    }

    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('newMessage', (message: any) => {
      setMessages((prev) => {
        const exists = prev.some((m) => m.id === message.id);
        if (exists) return prev;
        return [...prev, {
          ...message,
          senderName: message.senderName,
        }];
      });
    });

    socket.on('onlineUsers', (users: OnlineUser[]) => {
      setOnlineUsers(users);
    });

    socket.on('userJoined', (data: { userId: string; userName: string }) => {
      console.log(`${data.userName} joined`);
    });

    socket.on('userLeft', (data: { userId: string; userName: string }) => {
      setOnlineUsers((prev) => prev.filter((u) => u.id !== data.userId));
    });

    socket.on('userTyping', (data: { userId: string; userName: string; isTyping: boolean }) => {
      setTypingUsers((prev) => {
        if (data.isTyping) {
          const exists = prev.some((u) => u.userId === data.userId);
          if (exists) return prev;
          return [...prev, { userId: data.userId, userName: data.userName }];
        } else {
          return prev.filter((u) => u.userId !== data.userId);
        }
      });
    });

    const dataToJoinChat = joinType === JoinType.group ? {
        userId: user.id,
        userName: user.displayName,
        group: { id: group?.id, name: group?.name },
    } : {
        userId: user.id,
        userName: user.displayName,
        targetUserId: privateChatUser?.id, // Assuming privateChatUser.id is the target user ID for private chats
    };

    console.log('Joining chat with data:', dataToJoinChat, 'and joinType:', joinType);

    // Join room
    socketService.handlePreJoin(dataToJoinChat, joinType);
    hasJoined.current = true;

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('newMessage');
      socket.off('onlineUsers');
      socket.off('userJoined');
      socket.off('userLeft');
      socket.off('userTyping');
    };
  }, [group, privateChatUser, user]);

  // Cleanup on unmount or group change
  useEffect(() => {
    return () => {
      if (group && user && hasJoined.current) {
        socketService.leaveRoom(group.id, user.id);
        hasJoined.current = false;
      }
    };
  }, [group, user]);

  const sendMessage = useCallback((content: string) => {
    if (!user || !content.trim() || !group) return;

    const message = {
      id: uuid(),
      senderId: user.id,
      senderName: user.displayName,
      content: content.trim(),
      timestamp: Date.now(),
      group: { id: group.id, name: group.name },
    };

    socketService.sendMessage(message);
    
    socketService.sendTyping(group.id, user.id, user.displayName, false);
  }, [user, group]);

  const handleTyping = useCallback(() => {
    if (!user || !group) return;

    socketService.sendTyping(group.id, user.id, user.displayName, true);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socketService.sendTyping(group.id, user.id, user.displayName, false);
    }, 2000);
  }, [user, group]);

  const copyInviteLink = () => {
    if (!group) return;
    const link = `${window.location.origin}/join/${group.inviteCode}`;
    navigator.clipboard.writeText(link);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  if (authLoading || isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-gray-50">
        <p className="text-red-500 mb-4">{error || 'Không tìm thấy nhóm'}</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
            {joinType === JoinType.group ? group?.name.charAt(0).toUpperCase() : privateChatUser?.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="font-semibold text-gray-800">
              {joinType === JoinType.group ? group?.name : privateChatUser?.name}
            </h1>
            <p className="text-xs text-gray-500">
              {isConnected ? (
                <>
                  {onlineUsers.length} đang online
                  {typingUsers.length > 0 && (
                    <span className="ml-2 text-blue-500">
                      {typingUsers.map(u => u.userName).join(', ')} đang nhập...
                    </span>
                  )}
                </>
              ) : (
                <span className="text-red-500">Đang kết nối...</span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-blue-500 hover:bg-blue-50 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Mời
          </button>
          <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        </div>
      </header>

      {/* Messages */}
      <MessageList
        messages={messages.map(m => ({
          id: m.id,
          senderId: m.senderId,
          senderName: m.senderName || 'Unknown',
          content: m.content,
          timestamp: m.timestamp,
          group: m.group || { id: group?.id, name: group?.name },
        }))}
        currentUserId={user?.id || ''}
      />

      {/* Message Input */}
      <MessageInput
        onSendMessage={sendMessage}
        onTyping={handleTyping}
        disabled={!isConnected}
      />

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Mời tham gia nhóm</h2>
            <p className="text-gray-500 mb-4">Chia sẻ link này để mời người khác tham gia:</p>
            
            <div className="flex items-center gap-2 p-3 bg-gray-100 rounded-lg mb-4">
              <input
                type="text"
                readOnly
                value={`${window.location.origin}/join/${group?.inviteCode}`}
                className="flex-1 bg-transparent text-sm text-gray-700 outline-none"
              />
              <button
                onClick={copyInviteLink}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  copySuccess 
                    ? 'bg-green-500 text-white' 
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                {copySuccess ? 'Đã sao chép!' : 'Sao chép'}
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-2">Hoặc sử dụng mã mời:</p>
              <div className="text-center py-3 bg-gray-100 rounded-lg text-2xl font-mono tracking-wider">
                {group?.inviteCode}
              </div>
            </div>

            <button
              onClick={() => setShowInviteModal(false)}
              className="w-full py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
