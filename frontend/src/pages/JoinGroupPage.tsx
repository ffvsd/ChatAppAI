import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/apiService';

interface GroupInfo {
  id: string;
  name: string;
  description?: string;
  memberCount: number;
}

export const JoinGroupPage: React.FC = () => {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [groupInfo, setGroupInfo] = useState<GroupInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadGroupInfo();
  }, [inviteCode]);

  const loadGroupInfo = async () => {
    if (!inviteCode) {
      setError('Mã mời không hợp lệ');
      setIsLoading(false);
      return;
    }

    try {
      const data = await apiService.getGroupByInviteCode(inviteCode);
      if (data.error) {
        setError(data.error);
      } else {
        setGroupInfo(data);
      }
    } catch (err: any) {
      setError(err.message || 'Không thể tải thông tin nhóm');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=/join/${inviteCode}`);
      return;
    }

    setIsJoining(true);
    setError('');

    try {
      const group = await apiService.joinGroup(inviteCode!);
      navigate(`/chat/${group.id}`);
    } catch (err: any) {
      setError(err.message || 'Không thể tham gia nhóm');
    } finally {
      setIsJoining(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        {error ? (
          <div className="text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-800 mb-2">Không thể tham gia nhóm</h1>
            <p className="text-gray-500 mb-6">{error}</p>
            <Link
              to="/"
              className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-6 rounded-xl"
            >
              Về trang chủ
            </Link>
          </div>
        ) : groupInfo ? (
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl font-bold text-white">
                {groupInfo.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">{groupInfo.name}</h1>
            {groupInfo.description && (
              <p className="text-gray-500 mb-2">{groupInfo.description}</p>
            )}
            <p className="text-sm text-gray-400 mb-6">{groupInfo.memberCount} thành viên</p>

            {!isAuthenticated && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-lg text-sm">
                Bạn cần đăng nhập hoặc tạo tài khoản tạm thời để tham gia nhóm
              </div>
            )}

            <button
              onClick={handleJoin}
              disabled={isJoining}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white 
                       font-semibold py-3 px-6 rounded-xl transition-colors duration-200 mb-3"
            >
              {isJoining ? 'Đang tham gia...' : isAuthenticated ? 'Tham gia nhóm' : 'Đăng nhập để tham gia'}
            </button>

            {!isAuthenticated && (
              <Link
                to={`/guest?redirect=/join/${inviteCode}`}
                className="w-full block text-center bg-orange-500 hover:bg-orange-600 text-white 
                         font-semibold py-3 px-6 rounded-xl transition-colors duration-200"
              >
                Tham gia bằng tên tạm thời
              </Link>
            )}
          </div>
        ) : (
          <div className="text-center">
            <p className="text-gray-500">Không tìm thấy thông tin nhóm</p>
          </div>
        )}
      </div>
    </div>
  );
};
