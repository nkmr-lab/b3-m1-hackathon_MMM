import React, { useState } from 'react';
import { Search, BotMessageSquare } from 'lucide-react';
import signInWithGoogle, { signOutUser } from '../utils/auth';
import { useAuth } from '../context/AuthContext';

const Header = () => {
  const { user } = useAuth();
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <header className="bg-white shadow-md">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div
              className="flex items-center space-x-2 cursor-pointer"
              onClick={() => window.location.href = '/'}
            >
              <BotMessageSquare className="text-gray-600" size={30} />
              <span className="text-sm font-semibold text-gray-600">
                ナカノ<br />DE<br />ハイク
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button
              className="text-gray-600"
              onClick={() => window.location.href = '/create-post'}
            >
              投稿する
            </button>
            <button
              className="text-gray-600"
              onClick={() => window.location.href = '/feed'}
            >
              投稿一覧
            </button>
            <button
              className="text-gray-600"
              onClick={() => window.location.href = '/events'}
            >
              イベント
            </button>
            {user && (<span className="text-sm text-gray-600">ようこそ、{user.displayName}さん</span>)}
            <button
              onClick={() => {
                if (user) {
                  signOutUser();
                } else {
                  signInWithGoogle();
                }
              }}
              style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer' }} // ボタンのデフォルトスタイルをリセット
            >
              <img
                src={user?.photoURL || '/icons/google.png'} // nullの場合の代替URLを指定
                alt={`${user?.displayName}'s profile`}
                style={{ borderRadius: '50%', width: '40px', height: '40px' }}
              />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;