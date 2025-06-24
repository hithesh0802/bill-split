"use client";
import React from "react";

export default function SplashScreen() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-blue-900 z-50">
      <a target="_blank" href="https://icons8.com/icon/eYaVJ9Nbqqbw/dollar-bag" className="w-24 h-24 mb-4" />
      <h1 className="text-3xl font-bold text-white mb-2">Welcome to SplitEase</h1>
      <p className="text-blue-200">Loading your experience...</p>
    </div>
  );
}