import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '../services/apiService';
import { Group, User } from '../types';
import { JoinType } from '../services/socketService';

interface ChatListProps {
  onSelectChat: (chatId: string, joinType: JoinType) => void;
}

export const ChatList: React.FC<ChatListProps> = ({ onSelectChat }) => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Search states
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [searchedUsers, setSearchedUsers] = useState<User[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadGroups();
  }, []);

  // Debounce search term - đợi 2 giây sau khi user ngừng gõ
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 1500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Gọi API search users khi debounced search term thay đổi
  useEffect(() => {
    const searchUsers = async () => {
      if (!debouncedSearchTerm.trim()) {
        setSearchedUsers([]);
        setIsSearchingUsers(false);
        return;
      }

      setIsSearchingUsers(true);
      try {
        const users = await apiService.getUserByName(debouncedSearchTerm.trim());
        setSearchedUsers(users);
      } catch (err) {
        console.error('Failed to search users:', err);
        setSearchedUsers([]);
      } finally {
        setIsSearchingUsers(false);
      }
    };

    searchUsers();
  }, [debouncedSearchTerm]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setShowSearchDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadGroups = async () => {
    try {
      const data = await apiService.getMyGroups();
      setGroups(data);
    } catch (err) {
      console.error('Failed to load groups:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!newGroupName.trim()) {
      setError('Vui lòng nhập tên nhóm');
      return;
    }

    try {
      const group = await apiService.createGroup(newGroupName.trim(), newGroupDescription.trim());
      setShowCreateModal(false);
      setNewGroupName('');
      setNewGroupDescription('');
      loadGroups();
      navigate(`/chat/group/${group.id}`);
    } catch (err: any) {
      setError(err.message || 'Không thể tạo nhóm');
    }
  };

  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!inviteCode.trim()) {
      setError('Vui lòng nhập mã mời');
      return;
    }

    try {
      const group = await apiService.joinGroup(inviteCode.trim());
      setShowJoinModal(false);
      setInviteCode('');
      loadGroups();
      navigate(`/chat/group/${group.id}`);
    } catch (err: any) {
      setError(err.message || 'Không thể tham gia nhóm');
    }
  };

  const handleSelectChat = (chatId: string, joinType: JoinType) => {
    setShowSearchDropdown(false);
    setSearchTerm('');
    if (onSelectChat) {
      onSelectChat(chatId, joinType);
    }
  };

  const handleSearchFocus = () => {
    setShowSearchDropdown(true);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    // Hiển thị loading khi user đang gõ
    if (e.target.value.trim()) {
      setIsSearchingUsers(true);
    }
  };

  // Filter groups dựa trên searchTerm (filter trực tiếp, không cần đợi)
  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Kiểm tra xem có đang search hay không
  const isSearching = searchTerm.trim().length > 0;

  return (
    <div className="h-full bg-white flex flex-col border-r border-gray-200 w-full">
      {/* Header */}
      <div className="w-full p-4 border-b border-gray-100 relative">
        {/* Search Bar */}
        <div className="w-full flex relative">
          <svg
            className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Tìm kiếm bạn bè, nhóm..."
            value={searchTerm}
            onChange={handleSearchChange}
            onFocus={handleSearchFocus}
            className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
          {/* Clear button */}
          {searchTerm && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSearchedUsers([]);
                setDebouncedSearchTerm('');
              }}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Search Dropdown */}
        {showSearchDropdown && (
          <div
            ref={dropdownRef}
            className="absolute left-0 right-0 top-full mt-1 mx-4 bg-white rounded-xl shadow-lg border border-gray-200 max-h-96 overflow-y-auto z-50"
          >
            {/* Users Section - Bạn bè */}
            <div className="p-3 border-b border-gray-100">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Bạn bè
              </h3>
              {isSearchingUsers ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                  <span className="ml-2 text-sm text-gray-500">Đang tìm kiếm...</span>
                </div>
              ) : searchedUsers.length > 0 ? (
                <div className="space-y-1">
                  {searchedUsers.map((user) => (
                    <div
                      key={user.id}
                      onClick={() => handleSelectChat(user.id, JoinType.private)}
                      className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                    >
                      <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-teal-500 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                        {user.displayName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 truncate">{user.displayName}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                  ))}
                </div>
              ) : isSearching ? (
                <p className="text-sm text-gray-400 py-2 text-center">
                  {debouncedSearchTerm ? 'Không tìm thấy người dùng' : 'Đang chờ...'}
                </p>
              ) : (
                <p className="text-sm text-gray-400 py-2 text-center">
                  Nhập tên để tìm bạn bè
                </p>
              )}
            </div>

            {/* Groups Section - Nhóm chat */}
            <div className="p-3">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Nhóm chat
              </h3>
              {filteredGroups.length > 0 && searchTerm.length > 0 ? (
                <div className="space-y-1">
                  {filteredGroups.slice(0, 5).map((group) => (
                    <div
                      key={group.id}
                      onClick={() => handleSelectChat(group.id, JoinType.group)}
                      className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                    >
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                        {group.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 truncate">{group.name}</p>
                        <p className="text-xs text-gray-500 truncate">
                          {group.members?.length || 0} thành viên
                        </p>
                      </div>
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                      </svg>
                    </div>
                  ))}
                  {filteredGroups.length > 5 && (
                    <p className="text-xs text-gray-400 text-center py-1">
                      +{filteredGroups.length - 5} nhóm khác
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-400 py-2 text-center">
                  {isSearching ? 'Không tìm thấy nhóm' : 'Chưa có nhóm nào'}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="px-4 py-2 flex gap-2 border-b border-gray-100">
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Tạo nhóm
        </button>
        <button
          onClick={() => setShowJoinModal(true)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          Tham gia
        </button>
      </div>

      {/* Groups List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-400 text-sm">
            <svg className="w-12 h-12 mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
            </svg>
            {searchTerm ? 'Không tìm thấy nhóm' : 'Chưa có nhóm nào'}
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filteredGroups.map((group) => (
              <div
                key={group.id}
                onClick={() => handleSelectChat(group.id, JoinType.group)}
                className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors ${groupId === group.id ? 'bg-blue-50' : ''
                  }`}
              >
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-lg flex-shrink-0">
                  {group.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-800 truncate">{group.name}</h3>
                    {/* <span className="text-xs text-gray-400">12:30</span> */}
                  </div>
                  <p className="text-sm text-gray-500 truncate">
                    {group.description || `${group.members?.length || 0} thành viên`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Tạo nhóm mới</h2>
            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">{error}</div>
            )}
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tên nhóm</label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Nhập tên nhóm..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả (tùy chọn)</label>
                <textarea
                  value={newGroupDescription}
                  onChange={(e) => setNewGroupDescription(e.target.value)}
                  placeholder="Mô tả ngắn về nhóm..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 resize-none"
                  rows={3}
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setShowCreateModal(false); setError(''); }}
                  className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-blue-500 text-white hover:bg-blue-600"
                >
                  Tạo nhóm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Join Group Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Tham gia nhóm</h2>
            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">{error}</div>
            )}
            <form onSubmit={handleJoinGroup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mã mời</label>
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder="Nhập mã mời..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500"
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setShowJoinModal(false); setError(''); }}
                  className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-blue-500 text-white hover:bg-blue-600"
                >
                  Tham gia
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};