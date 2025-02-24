import React from 'react';
import Link from 'next/link';
import { FaRunning, FaEye, FaFeatherAlt } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="bg-gray-800 shadow-md w-full fixed bottom-0 left-0 z-50">
      <div className="px-4 py-3">
        <div className="flex items-center justify-center space-x-8">
          <div className="flex flex-col items-center">
            <Link href="/create-post" className="flex flex-col items-center text-xs text-gray-200">
              <FaRunning className="text-gray-200 mb-1" />
              実績
            </Link>
          </div>
          <div className="flex flex-col items-center">
            <Link href="/feed" className="flex flex-col items-center text-xs text-gray-200">
              <FaEye className="text-gray-200 mb-1" />
              見る
            </Link>
          </div>
          <div className="flex flex-col items-center">
            <Link href="/events" className="flex flex-col items-center text-xs text-gray-200">
              <FaFeatherAlt className="text-gray-200 mb-1" />
              詠む
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;