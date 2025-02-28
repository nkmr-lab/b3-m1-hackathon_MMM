import signInWithGoogle, { signOutUser } from '../utils/auth';
import { useAuth } from '../context/AuthContext';
import Link from 'next/link';
import Image from 'next/image';

const Header = () => {
  const { user } = useAuth();
  const iconUrl = user?.photoURL || '/icons/google.png'

  return (
    <>
      <header className="fixed top-0 left-0 w-full bg-gray-800 z-50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href={"/"} passHref>
                <div className="flex items-center space-x-2 cursor-pointer">
                  <span className="text-sm font-semibold text-gray-200">
                    ナカノ DE ハイク
                  </span>
                </div>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <span className="text-sm text-gray-200">ようこそ、{user.displayName}さん</span>
              ) : (
                <span
                  className="text-sm text-gray-200 cursor-pointer"
                  onClick={() => {
                    if (user) {
                      signOutUser();
                    } else {
                      signInWithGoogle();
                    }
                  }}>Googleでログイン
                  </span>
              )}
              <button
                onClick={() => {
                  if (user) {
                    signOutUser();
                  } else {
                    signInWithGoogle();
                  }
                }}
                style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer' }}
              >
                <Image
                  unoptimized
                  src={iconUrl}
                  alt={"icon"}
                  width={30}
                  height={30}
                  style={{ borderRadius: '50%' }}
                />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ヘッダーの高さ分の余白を確保 */}
      <div className="h-14"></div>
    </>
  );
};

export default Header;
