'use client';

import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import 'next-auth';

export default function Navbar() {
  const { data: session } = useSession();

  return (
    <nav className="bg-gray-900 text-white px-6 py-4 shadow-md">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Logo */}
        <div className="text-2xl font-bold text-blue-400 tracking-wide">
          <Link href="/">SplitEase</Link>
        </div>

        {/* Links */}
        <div className="space-x-4 flex items-center">
          {session ? (
            <>
              <Link
                href="/dashboard"
                className="hover:text-blue-400 transition-colors duration-200"
              >
                Dashboard
              </Link>
              <Link
                href="/profile"
                className="hover:text-blue-400 transition-colors duration-200"
              >
                Profile
              </Link>
              <button
                onClick={() => signOut()}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md transition"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="hover:text-blue-400 transition-colors duration-200"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-md transition"
              >
                Signup
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}