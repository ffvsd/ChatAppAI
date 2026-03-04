import React, { use, useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { ChatList } from '../components/ChatList';
import { JoinType } from '../services/socketService';

export const MainLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isChatPage = location.pathname.startsWith('/chat/');
  const [ isMobile, setIsMobile ] = useState(window.innerWidth < 768);
  const [showChatList, setShowChatList] = useState(true);
  

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (isMobile && isChatPage) {
      setShowChatList(false);
    }
  }, [isMobile, isChatPage]);

  const handleChatIconClick = () => {
    if (isMobile) {
      setShowChatList(prev => !prev);
    }
  };

  const handleSelectChat = (chatId: string, joinType: JoinType) => {
    if (isMobile) {
      setShowChatList(false);
    }
    if (joinType === JoinType.group) {
      navigate(`/chat/group/${chatId}`);
    } else if (joinType === JoinType.private) {
        console.log('Navigating to private chat with userId:', chatId);
      navigate(`/chat/private/${chatId}`);
    }
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Left Sidebar - Menu Icons (approximately 0.5/12 columns = ~4.16%) */}
      <div className="w-16 flex-shrink-0">
        <Sidebar onChatIconClick={handleChatIconClick} />
      </div>

      {/* Chat List Panel (from 0.5 to column 4, so ~3.5/12 = ~29%) */}
      <div className={`${isMobile && !showChatList ? 'hidden' : 'block'} ${isMobile ? 'w-full' : 'w-80'}`}>
        <ChatList onSelectChat={handleSelectChat}/>
      </div>

      {/* Chat Area - Main Content (remaining space ~8/12 = ~66%) */}
      <div className={`flex-1 flex flex-col min-w-0 ${isMobile && showChatList ? 'hidden' : 'block'}`}>
        {isChatPage ? (
          <Outlet />
        ) : (
          <div className="h-full flex flex-col items-center justify-center bg-gray-50 text-gray-400">
            <svg className="w-24 h-24 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-lg font-medium">Chào mừng đến với Chat App</p>
            <p className="text-sm mt-1">Chọn một cuộc hội thoại để bắt đầu</p>
          </div>
        )}
      </div>
    </div>
  );
};
