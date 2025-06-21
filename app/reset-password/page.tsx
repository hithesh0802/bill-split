"use client";
import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const params = useSearchParams();
  const token = params.get("token");
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json();
    if (data.success) {
      setMsg("Password reset! You can now log in.");
      setTimeout(() => router.push("/login"), 2000);
    } else {
      setMsg(data.error || "Reset failed.");
    }
  };

  if (!token) return <div className="text-white p-8">Invalid or missing token.</div>;

  return (
    <div className="max-w-md mx-auto p-8 text-white">
      <h1 className="text-2xl font-bold mb-4">Reset Password</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="password"
          className="p-2 rounded text-white bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
          placeholder="New password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <button className="bg-green-600 px-4 py-2 rounded text-white font-semibold">
          Reset Password
        </button>
      </form>
      {msg && <div className="mt-4 text-green-300">{msg}</div>}
    </div>
  );
}