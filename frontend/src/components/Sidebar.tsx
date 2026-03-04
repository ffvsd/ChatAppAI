import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { UserType } from '../types';
const chatAppLogo = new URL('../assets/share.png', import.meta.url).toString();


interface SidebarProps {
  onSettingsClick?: () => void;
  onChatIconClick?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onSettingsClick, onChatIconClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showUserPopup, setShowUserPopup] = useState(false);
  const [showSettingsPopup, setShowSettingsPopup] = useState(false);
  const userPopupRef = useRef<HTMLDivElement>(null);
  const settingsPopupRef = useRef<HTMLDivElement>(null);

  // Close popups when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userPopupRef.current && !userPopupRef.current.contains(event.target as Node)) {
        setShowUserPopup(false);
      }
      if (settingsPopupRef.current && !settingsPopupRef.current.contains(event.target as Node)) {
        setShowSettingsPopup(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="h-full bg-blue-600 flex flex-col items-center py-4 w-full">
      {/* Logo/App Icon */}
      <div className="mb-16">
        <img src={chatAppLogo} alt="Chat App Logo" className="w-10 h-10 rounded-lg" />
      </div>

      {/* Navigation Icons */}
      <div className="flex-1 flex flex-col items-center gap-2">
        {/* Chat Icon - Active */}
        <button 
          onClick={onChatIconClick}
          className="w-10 h-10 rounded-lg flex items-center justify-center bg-white/20 text-white hover:bg-white/30 transition-colors"
          title="Tin nhắn"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>

        {/* Contacts Icon */}
        <button 
          className="w-10 h-10 rounded-lg flex items-center justify-center text-white/70 hover:bg-white/20 hover:text-white transition-colors"
          title="Danh bạ"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </button>
      </div>

      {/* Bottom Icons */}
      <div className="flex flex-col items-center gap-2">
        {/* Settings */}
        <div className="relative" ref={settingsPopupRef}>
          <button 
            onClick={() => {
              setShowSettingsPopup(!showSettingsPopup);
              setShowUserPopup(false);
            }}
            className="w-10 h-10 rounded-lg flex items-center justify-center text-white/70 hover:bg-white/20 hover:text-white transition-colors"
            title="Cài đặt"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>

          {/* Settings Popup */}
          {showSettingsPopup && (
            <div className="absolute left-full ml-2 bottom-0 bg-white rounded-lg shadow-lg py-2 w-48 z-50">
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-800">Cài đặt</p>
              </div>
              <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                Thông báo
              </button>
              <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Quyền riêng tư
              </button>
              <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
                Giao diện
              </button>
            </div>
          )}
        </div>

        {/* User Avatar */}
        <div className="relative" ref={userPopupRef}>
          <button
            onClick={() => {
              setShowUserPopup(!showUserPopup);
              setShowSettingsPopup(false);
            }}
            className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-semibold hover:bg-white/30 transition-colors overflow-hidden"
            title={user?.displayName || 'User'}
          >
            {user?.displayName?.charAt(0).toUpperCase() || 'U'}
          </button>

          {/* User Popup */}
          {showUserPopup && (
            <div className="absolute left-full ml-2 bottom-0 bg-white rounded-lg shadow-lg py-2 w-56 z-50">
              {/* User Info */}
              <div className="px-4 py-3 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold">
                    {user?.displayName?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{user?.displayName}</p>
                    <p className="text-xs text-gray-500">
                      {user?.email || 'Người dùng tạm thời'}
                    </p>
                    {user?.userType === UserType.TEMPORARY && (
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded mt-1 inline-block">
                        Tạm thời
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Thông tin cá nhân
              </button>
              
              {user?.userType === UserType.TEMPORARY && (
                <button 
                  onClick={() => navigate('/register')}
                  className="w-full px-4 py-2 text-left text-sm text-blue-600 hover:bg-blue-50 flex items-center gap-3"
                >
                  <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Đăng ký để lưu trữ
                </button>
              )}

              <div className="border-t border-gray-100 mt-1">
                <button 
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3"
                >
                  <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Đăng xuất
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
