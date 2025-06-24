"use client";
import './globals.css'
import Navbar from '@/components/Navbar'
import { useEffect, useState } from "react";
import { ReactNode } from 'react'
import { Providers } from "./providers";
import SplashScreen from "@/components/SplashScreen";
import OfflineScreen from "@/components/OfflineScreen";

export default function RootLayout({ children }: { children: ReactNode }) {
  const [showSplash, setShowSplash] = useState(true);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2000); // 2 seconds
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <html lang="en">
      <body className="bg-gray-100 text-gray-900">
      { showSplash ? <SplashScreen /> : !isOnline ? (
          <OfflineScreen />
        ) :
      (
      <Providers>
        <Navbar />
        <main className="p-8">{children}</main>
      </Providers> 
      )
    }
      </body>
    </html>
  )
}
