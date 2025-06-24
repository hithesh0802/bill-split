"use client";
import React from "react";

export default function OfflineScreen() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-gray-900 z-50">
      <span className="text-6xl mb-4">📡</span>
      <h2 className="text-2xl font-bold text-red-400 mb-2">No Internet Connection</h2>
      <p className="text-gray-300">Please check your connection and try again.</p>
    </div>
  );
}