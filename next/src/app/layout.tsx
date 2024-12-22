"use client";

import "./globals.css";
import { AuthProvider } from "../context/AuthContext";
import { Toaster } from 'react-hot-toast';
import Header from '../components/Header';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <AuthProvider>
          <Header />
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}