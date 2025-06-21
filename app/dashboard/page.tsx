"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Pie } from "react-chartjs-2";
import { Chart, ArcElement, Tooltip, Legend } from "chart.js";
Chart.register(ArcElement, Tooltip, Legend);

export default function DashboardPage() {
  type SessionType = {
    user?: {
      email?: string;
      username?: string;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
  type UserType = {
    _id: string;
    username: string;
    email: string;
    friends?: UserType[];
    [key: string]: unknown;
  };
  type ExpenseType = {
    _id: string;
    group: string;
    paidBy: string;
    amount: number;
    category: string;
    description?: string;
    createdAt: string;
  };
  type GroupType = {
    _id: string;
    name: string;
    creator: UserType;
    members: UserType[];
    expenses?: ExpenseType[];
  };

  // State
  const [session, setSession] = useState<SessionType | null>(null);
  const [search, setSearch] = useState<string>("");
  const [results, setResults] = useState<UserType[]>([]);
  const [friends, setFriends] = useState<UserType[]>([]);
  const [groups, setGroups] = useState<GroupType[]>([]);
  const [groupName, setGroupName] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<GroupType | null>(null);
  const [groupMembers, setGroupMembers] = useState<UserType[]>([]);
  const [groupMsg, setGroupMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const router = useRouter();

  // Fetch session on mount
  useEffect(() => {
    (async () => {
      const res = await fetch("/api/auth/session");
      const data = await res.json();
      if (!data?.user) router.push("/login");
      setSession(data);
    })();
  }, [router]);

  // Fetch user's friends on session load
  useEffect(() => {
    if (!session?.user?.email) return;
    (async () => {
        const res = await fetch("/api/users/search?q=" + session.user!.email);
        const users = await res.json();
        // If friends are already populated user objects, just use them directly:
        if (users[0] && Array.isArray(users[0].friends)) {
        setFriends(users[0].friends as UserType[]);
        } else {
        setFriends([]);
        }
    })();
    }, [session]);

  // Fetch user's groups
  useEffect(() => {
    if (!session?.user?.email) return;
    (async () => {
      const res = await fetch("/api/groups/user");
      const data = await res.json();
      setGroups(data.groups || []);
    })();
  }, [session]);

  // Handle search
  const handleSearch = async () => {
    if (!search) return setResults([]);
    const res = await fetch(`/api/users/search?q=${encodeURIComponent(search)}`);
    const users = await res.json();
    setResults(Array.isArray(users) ? users : []);
  };

  // Add or remove friend
  const handleFriend = async (friendId: string, action: "add" | "remove") => {
    const res = await fetch("/api/users/friend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ friendId, action }),
    });
    let data: { friends?: UserType[]; error?: string } = {};
    try {
      data = await res.json();
    } catch {
      data = { error: "Invalid response from server" };
    }
    if (data.friends) {
      setFriends(data.friends);
      // Optionally show a toast or message
    }
  };

  // Create group
  const handleCreateGroup = async () => {
    setGroupMsg(null);
    if (!groupName.trim()) {
      setGroupMsg({ type: "error", text: "Group name cannot be empty." });
      return;
    }
    if (groupMembers.length === 0) {
      setGroupMsg({ type: "error", text: "Select at least one friend to add to the group." });
      return;
    }
    const memberIds = groupMembers.map(m => m._id);
    const res = await fetch("/api/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: groupName, memberIds }),
    });
    if (!res.ok) {
      setGroupMsg({ type: "error", text: "Failed to create group." });
      return;
    }
    const group = await res.json();
    setGroups(prev => [...prev, group]);
    setGroupName("");
    setGroupMembers([]);
    setGroupMsg({ type: "success", text: "Group created successfully!" });
    setTimeout(() => setGroupMsg(null), 2000);
  };

  // Delete group
  const handleDeleteGroup = async (groupId: string) => {
    setGroupMsg(null);
    const res = await fetch(`/api/groups/${groupId}`, { method: "DELETE" });
    if (!res.ok) {
      setGroupMsg({ type: "error", text: "Failed to delete group." });
      return;
    }
    setGroups(groups.filter(g => g._id !== groupId));
    setSelectedGroup(null);
    setGroupMsg({ type: "success", text: "Group deleted successfully!" });
    setTimeout(() => setGroupMsg(null), 2000);
  };

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-gray-900 to-gray-800 min-h-screen text-white">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold mb-6 text-blue-400 drop-shadow">
          Welcome, <span className="text-white">{session?.user?.email || "Loading..."}</span>
        </h1>
        {/* Search Users */}
        <div className="mb-6 flex flex-col md:flex-row gap-2 items-center">
          <input
            className="text-white p-2 rounded flex-1"
            placeholder="Search users..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded font-semibold"
            onClick={handleSearch}
          >
            Search
          </button>
        </div>
        {/* Search Results */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-2 text-blue-300">Search Results:</h2>
          {results.length === 0 && <div className="text-gray-400">No users found.</div>}
          <ul>
            {results.map(user => (
              <li key={user._id} className="mb-2 flex items-center">
                <span className="mr-2">{user.username} <span className="text-gray-400">({user.email})</span></span>
                {friends.some(f => f._id === user._id) ? (
                  <button
                    className="ml-2 px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs"
                    onClick={() => handleFriend(user._id, "remove")}
                  >
                    Unfriend
                  </button>
                ) : (
                  <button
                    className="ml-2 px-2 py-1 bg-green-600 hover:bg-green-700 rounded text-xs"
                    onClick={() => handleFriend(user._id, "add")}
                  >
                    Add Friend
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
        {/* Friends List */}
        <div className="mb-10">
          <h2 className="text-xl font-semibold mb-2 text-blue-300">Your Friends:</h2>
          <ul className="flex flex-wrap gap-2">
            {friends.length === 0 && <li className="text-gray-400">No friends yet.</li>}
            {friends.map(u => (
              <li key={u._id} className="bg-gray-700 px-3 py-1 rounded">
                {u.username} <span className="text-gray-400">({u.email})</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2 text-blue-300">Create a Group:</h2>
        <div className="flex flex-col md:flex-row gap-2 items-center">
          <input
            className="text-white p-2 rounded flex-1"
            placeholder="New group name"
            value={groupName}
            onChange={e => setGroupName(e.target.value)}
          />
          <select
            multiple
            className="text-white p-2 rounded flex-1"
            value={groupMembers.map(m => m._id)}
            onChange={e => {
              const selected = Array.from(e.target.selectedOptions).map(opt => opt.value);
              setGroupMembers(friends.filter(f => selected.includes(f._id)));
            }}
          >
            {friends.map(f => (
              <option key={f._id} value={f._id}>
                {f.username} ({f.email})
              </option>
            ))}
          </select>
          <button
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-semibold"
            onClick={handleCreateGroup}
          >
            Create Group
          </button>
        </div>
        {groupMsg && (
          <div
            className={`mt-2 px-4 py-2 rounded font-semibold ${
              groupMsg.type === "success"
                ? "bg-green-700 text-green-100"
                : "bg-red-700 text-red-100"
            }`}
          >
            {groupMsg.text}
          </div>
        )}
      </div>
        {/* Groups Section */}
        <div className="mb-10">
        <h2 className="text-xl font-semibold mb-2 text-blue-300">Your Groups:</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groups.length === 0 && <div className="text-gray-400">No groups yet.</div>}
          {groups.map(group => (
            <Link
              key={group._id}
              href={`/dashboard/groups/${group._id}`}
              className="block bg-gray-800 hover:bg-blue-900 border border-blue-400 rounded-lg p-4 shadow transition-all"
            >
              <div className="flex justify-between items-center">
                <span className="font-bold text-lg text-blue-200">{group.name}</span>
                {group.creator.email === session?.user?.email && (
                  <button
                    className="ml-4 bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-xs font-semibold"
                    onClick={e => {
                      e.preventDefault();
                      handleDeleteGroup(group._id);
                    }}
                  >
                    Delete
                  </button>
                )}
              </div>
              <div className="mt-2 text-sm text-gray-300">
                Members: {group.members.length}
              </div>
            </Link>
          ))}
        </div>
      </div>
      </div>
    </div>
  );
}