"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";

type UserType = {
  _id: string;
  username: string;
  email: string;
  profilePic?: string;
};

export default function ProfilePage() {
  const [user, setUser] = useState<UserType | null>(null);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch user profile
  useEffect(() => {
    (async () => {
      const res = await fetch("/api/profile");
      const data = await res.json();
      setUser(data.user);
      console.log(user);
      setUsername(data.user?.username || "");
      setEmail(data.user?.email || "");
      setProfilePic(data.user?.profilePic || null);
    })();
  }, [user]);

  // Handle profile update
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email }),
    });
    const data = await res.json();
    if (data.success) {
      setMsg("Profile updated!");
      setUser((u) => u ? { ...u, username, email } : u);
    } else {
      setMsg(data.error || "Update failed.");
    }
  };

  // Handle profile picture upload (unchanged)
  const handlePicUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setMsg(null);
    const formData = new FormData();
    formData.append("profilePic", file);
    const res = await fetch("/api/profile/picture", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    if (data.success && data.url) {
      setProfilePic(data.url);
      setMsg("Profile picture updated!");
      setUser((u) => u ? { ...u, profilePic: data.url } : u);
    } else {
      setMsg(data.error || "Upload failed.");
    }
  };

  return (
    <div className="max-w-xl mx-auto p-8 text-white">
      <h1 className="text-3xl font-bold mb-6 text-blue-400">Your Profile</h1>
      {msg && (
        <div className="mb-4 px-4 py-2 rounded font-semibold bg-blue-900 text-blue-100">
          {msg}
        </div>
      )}
      <div className="flex flex-col items-center mb-8">
        <div className="mb-2">
          <Image
            src={profilePic || "/default-profile.jpg"}
            alt="Profile"
            width={128}
            height={128}
            className="w-32 h-32 rounded-full object-cover border-4 border-blue-400"
          />
        </div>
        <form onSubmit={handlePicUpload} className="flex flex-col items-center gap-2">
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            className="hidden"
            onChange={e => setFile(e.target.files?.[0] || null)}
          />
          <button
            type="button"
            className="bg-blue-700 px-4 py-2 rounded text-white font-semibold"
            onClick={() => fileInputRef.current?.click()}
          >
            Choose Picture
          </button>
          {file && (
            <button
              type="submit"
              className="bg-green-600 px-4 py-2 rounded text-white font-semibold"
            >
              Upload
            </button>
          )}
        </form>
      </div>
      <form onSubmit={handleUpdate} className="flex flex-col gap-4">
        <label className="font-semibold">
          Username:
          <input
            className="block mt-1 p-2 rounded text-white w-full"
            value={username}
            onChange={e => setUsername(e.target.value)}
          />
        </label>
        <label className="font-semibold">
          Email:
          <input
            className="block mt-1 p-2 rounded text-white w-full"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
        </label>
        <button
          type="submit"
          className="bg-blue-600 px-4 py-2 rounded text-white font-semibold"
        >
          Update Profile
        </button>
      </form>
    </div>
  );
}