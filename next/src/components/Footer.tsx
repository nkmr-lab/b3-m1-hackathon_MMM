import React from 'react';
import { FaPen, FaEye, FaFeatherAlt } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="bg-gray-800 shadow-md w-full fixed bottom-0 left-0 z-50">
      <div className="px-4 py-3">
        <div className="flex items-center justify-center space-x-8">
          <div className="flex flex-col items-center">
            <button
              className="flex flex-col items-center text-xs text-gray-200"
              onClick={() => window.location.href = '/create-post'}
            >
              <FaPen className="text-gray-200 mb-1" />
              日記
            </button>
          </div>
          <div className="flex flex-col items-center">
            <button
              className="flex flex-col items-center text-xs text-gray-200"
              onClick={() => window.location.href = '/feed'}
            >
              <FaEye className="text-gray-200 mb-1" />
              見る
            </button>
          </div>
          <div className="flex flex-col items-center">
            <button
              className="flex flex-col items-center text-xs text-gray-200"
              onClick={() => window.location.href = '/events'}
            >
              <FaFeatherAlt className="text-gray-200 mb-1" />
              俳句
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;