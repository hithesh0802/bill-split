"use client";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    // const res = await fetch("/api/auth/reset-request", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({ email }),
    // });
    setMsg("If your email exists, a reset link has been sent.");
  };

  return (
    <div className="max-w-md mx-auto p-8 text-white">
      <h1 className="text-2xl font-bold mb-4">Forgot Password</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          className="p-2 rounded text-white bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
          placeholder="Your email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <button className="bg-blue-600 px-4 py-2 rounded text-white font-semibold">
          Send Reset Link
        </button>
      </form>
      {msg && <div className="mt-4 text-green-300">{msg}</div>}
    </div>
  );
}