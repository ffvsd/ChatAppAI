import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { requestNotificationPermission } from '../services/firebase';

export const GuestPage: React.FC = () => {
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const { loginAsTemporary } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  useEffect(() => {
    const initNotifications = async () => {
      const token = await requestNotificationPermission();
      if (token) {
        setFcmToken(token);
      }
    };
    initNotifications();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!displayName.trim()) {
      setError('Vui lòng nhập tên của bạn');
      return;
    }

    setIsLoading(true);

    try {
      await loginAsTemporary(displayName.trim(), fcmToken || undefined);
      navigate(redirect);
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-10 h-10 text-orange-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Chat nhanh</h1>
          <p className="text-gray-500 mt-2">Nhập tên để bắt đầu chat ngay</p>
        </div>

        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-lg text-sm">
          <strong>Lưu ý:</strong> Bạn đang dùng chế độ tạm thời. Lịch sử chat sẽ không được lưu khi đóng trình duyệt.
          <Link to="/register" className="text-blue-500 hover:text-blue-600 font-medium ml-1">
            Đăng ký
          </Link>{' '}
          để lưu trữ.
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-2">
              Tên của bạn
            </label>
            <input
              type="text"
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Nhập tên của bạn..."
              className="w-full px-4 py-3 border border-gray-300 rounded-xl 
                       focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200
                       transition-all duration-200"
              autoFocus
              maxLength={30}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !displayName.trim()}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 
                     disabled:cursor-not-allowed text-white font-semibold py-3 px-6 
                     rounded-xl transition-colors duration-200
                     focus:outline-none focus:ring-2 focus:ring-orange-300"
          >
            {isLoading ? 'Đang xử lý...' : 'Bắt đầu chat'}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">hoặc</span>
          </div>
        </div>

        <div className="space-y-3">
          <Link
            to="/login"
            className="w-full block text-center bg-blue-500 hover:bg-blue-600 text-white 
                     font-semibold py-3 px-6 rounded-xl transition-colors duration-200"
          >
            Đăng nhập
          </Link>
          <Link
            to="/register"
            className="w-full block text-center bg-gray-100 hover:bg-gray-200 text-gray-700 
                     font-semibold py-3 px-6 rounded-xl transition-colors duration-200"
          >
            Đăng ký tài khoản mới
          </Link>
        </div>
      </div>
    </div>
  );
};
