"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Pie } from "react-chartjs-2";
import { Chart, ArcElement, Tooltip, Legend } from "chart.js";
Chart.register(ArcElement, Tooltip, Legend);

type UserType = {
  _id: string;
  username: string;
  email: string;
};
type ExpenseType = {
  _id: string;
  group: string;
  paidBy: UserType | string;
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

export default function GroupDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = Array.isArray(params.groupId) ? params.groupId[0] : params.groupId;
  const [group, setGroup] = useState<GroupType | null>(null);
  const [friends, setFriends] = useState<UserType[]>([]);
  const [session, setSession] = useState<{ user?: { email?: string } } | null>(null);
  const [memberMsg, setMemberMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [expenses, setExpenses] = useState<ExpenseType[]>([]);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [expenseMsg, setExpenseMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [sending, setSending] = useState(false);
  const [sendMsg, setSendMsg] = useState<string | null>(null);

  // Fetch session
  useEffect(() => {
    (async () => {
      const res = await fetch("/api/auth/session");
      const data = await res.json();
      setSession(data);
    })();
  }, []);

  // Fetch group details
  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/groups/${groupId}`);
      if (!res.ok) {
        router.push("/dashboard");
        return;
      }
      const data = await res.json();
      setGroup(data.group);
    })();
  }, [groupId, router]);

  // Fetch group's expenses
  const fetchExpenses = async () => {
    const res = await fetch(`/api/groups/${groupId}/expenses`);
    const data = await res.json();
    setExpenses(data.expenses || []);
  };
  useEffect(() => {
    fetchExpenses();
  }, [groupId]);

  // Handle adding expense
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setExpenseMsg(null);
    const res = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        groupId,
        amount: parseFloat(amount),
        category,
        description
      }),
    });
    const data = await res.json();
    if (data.expense) {
      setAmount("");
      setCategory("");
      setDescription("");
      setExpenseMsg({ type: "success", text: "Expense added!" });
      fetchExpenses(); // Refetch to get populated paidBy
      setTimeout(() => setExpenseMsg(null), 2000);
    } else if (data.error) {
      setExpenseMsg({ type: "error", text: data.error });
    }
  };

  // Handle deleting expense
  const handleDeleteExpense = async (expenseId: string) => {
    const res = await fetch(`/api/expenses/${expenseId}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) {
      fetchExpenses();
    }
  };

  // Fetch user's friends for adding members
  useEffect(() => {
    if (!session?.user?.email) return;
    (async () => {
      const res = await fetch("/api/users/search?q=" + session.user!.email);
      const users = await res.json();
      if (users[0] && Array.isArray(users[0].friends)) {
        setFriends(users[0].friends as UserType[]);
      } else {
        setFriends([]);
      }
    })();
  }, [session]);

  // Add or remove member
  const handleMember = async (memberId: string, action: "add" | "remove") => {
    setMemberMsg(null);
    const res = await fetch(`/api/groups/${groupId}/member`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId, action }),
    });
    const data = await res.json();
    if (data.members) {
      // Refetch group to update members
      const groupRes = await fetch(`/api/groups/${groupId}`);
      const groupData = await groupRes.json();
      setGroup(groupData.group);
      setMemberMsg({ type: "success", text: `Member ${action === "add" ? "added" : "removed"} successfully!` });
      setTimeout(() => setMemberMsg(null), 2000);
    } else if (data.error) {
      setMemberMsg({ type: "error", text: data.error });
    }
  };

  function getCategoryData(expenses: ExpenseType[]) {
    const categoryTotals: Record<string, number> = {};
    expenses.forEach(exp => {
      categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
    });
    const labels = Object.keys(categoryTotals);
    const data = Object.values(categoryTotals);
    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: [
            "#60a5fa", "#f472b6", "#fbbf24", "#34d399", "#a78bfa", "#f87171", "#38bdf8"
          ],
        },
      ],
    };
  }

  function calculateBalances(members: UserType[], expenses: ExpenseType[]) {
    const balances: Record<string, { user: UserType; paid: number; owes: number }> = {};
    members.forEach(m => {
      balances[m._id] = { user: m, paid: 0, owes: 0 };
    });

    expenses.forEach(exp => {
      const numMembers = members.length;
      const share = exp.amount / numMembers;
      const payerId = typeof exp.paidBy === "object" ? exp.paidBy._id : exp.paidBy;
      if (balances[payerId]) balances[payerId].paid += exp.amount;
      members.forEach(m => {
        balances[m._id].owes += share;
      });
    });

    const netBalances: { user: UserType; net: number }[] = [];
    Object.values(balances).forEach(b => {
      netBalances.push({ user: b.user, net: b.paid - b.owes });
    });
    return netBalances;
  }

  if (!group) return <div className="text-white p-8">Loading group details...</div>;

  const isCreator = group.creator.email === session?.user?.email;

  return (
    <div className="max-w-2xl mx-auto p-8 text-white">
      <h1 className="text-3xl font-bold mb-4 text-blue-300">{group.name}</h1>
      <div className="mb-4">
        <span className="font-semibold">Creator:</span> {group.creator.username} ({group.creator.email})
      </div>
      <div className="mb-4">
        <span className="font-semibold">Members:</span>
        <ul className="list-disc ml-6 mt-1">
          {group.members.map(m => (
            <li key={m._id} className="flex items-center">
              {m.username} ({m.email})
              {isCreator && m._id !== group.creator._id && (
                <button
                  className="ml-2 bg-red-500 hover:bg-red-700 px-2 py-1 rounded text-xs"
                  onClick={() => handleMember(m._id, "remove")}
                >
                  Remove
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>
      {isCreator && (
        <div className="mt-4">
          <strong className="text-blue-200">Add Member:</strong>
          <select
            className="text-white p-1 rounded ml-2 border-amber-50"
            onChange={e => {
              if (e.target.value) handleMember(e.target.value, "add");
            }}
            value=""
          >
            <option value="">Select friend</option>
            {friends
              .filter(f => !group.members.some(m => m._id === f._id))
              .map(f => (
                <option key={f._id} value={f._id}>
                  {f.username} ({f.email})
                </option>
              ))}
          </select>
        </div>
      )}
      {memberMsg && (
        <div
          className={`mt-4 px-4 py-2 rounded font-semibold ${
            memberMsg.type === "success"
              ? "bg-green-700 text-green-100"
              : "bg-red-700 text-red-100"
          }`}
        >
          {memberMsg.text}
        </div>
      )}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-2 text-blue-300">Expenses</h2>
        <form onSubmit={handleAddExpense} className="flex flex-col md:flex-row gap-2 mb-4">
          <input
            type="number"
            min="0"
            step="0.01"
            className="text-white p-2 rounded flex-1"
            placeholder="Amount"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            required
          />
          <input
            className="text-white p-2 rounded flex-1"
            placeholder="Category"
            value={category}
            onChange={e => setCategory(e.target.value)}
            required
          />
          <input
            className="text-white p-2 rounded flex-1"
            placeholder="Description"
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
          <button
            type="submit"
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-semibold"
          >
            Add Expense
          </button>
        </form>
        {expenseMsg && (
          <div
            className={`mb-4 px-4 py-2 rounded font-semibold ${
              expenseMsg.type === "success"
                ? "bg-green-700 text-green-100"
                : "bg-red-700 text-red-100"
            }`}
          >
            {expenseMsg.text}
          </div>
        )}
        <ul>
          {expenses.length === 0 && <li className="text-gray-400">No expenses yet.</li>}
          {expenses.map(exp => (
            <li key={exp._id} className="mb-2 p-2 rounded bg-gray-800 flex justify-between items-center">
              <div>
                <span className="font-bold">{exp.category}</span> - ₹{exp.amount}{" "}
                <span className="text-xs text-gray-400">
                  by {typeof exp.paidBy === "object" ? exp.paidBy.username : exp.paidBy}
                </span>
                {exp.description && <span className="ml-2 text-gray-300">({exp.description})</span>}
              </div>
              {/* Only show delete if you are the payer */}
              {session?.user?.email &&
                typeof exp.paidBy === "object" &&
                exp.paidBy.email === session.user.email && (
                  <button
                    className="ml-2 bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-xs"
                    onClick={() => handleDeleteExpense(exp._id)}
                  >
                    Delete
                  </button>
                )}
            </li>
          ))}
        </ul>
      </div>
      {group && expenses.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-2 text-blue-300">Balances</h2>
          <ul>
            {calculateBalances(group.members, expenses).map(({ user, net }) => (
              <li key={user._id} className="mb-1">
                {user.username} {net > 0 ? (
                  <span className="text-green-400">is owed ₹{net.toFixed(2)}</span>
                ) : net < 0 ? (
                  <span className="text-red-400">owes ₹{Math.abs(net).toFixed(2)}</span>
                ) : (
                  <span className="text-gray-400">is settled up</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      {session?.user?.email && group && expenses.length > 0 && (() => {
        const user = group.members.find(m => m.email === session.user!.email);
        if (!user) return null;
        const netBalances = calculateBalances(group.members, expenses);
        const you = netBalances.find(b => b.user._id === user._id);
        if (!you) return null;
        if (you.net < 0) {
          return (
            <div className="mt-2 text-red-300 font-semibold">
              You owe ₹{Math.abs(you.net).toFixed(2)} in this group.
            </div>
          );
        } else if (you.net > 0) {
          return (
            <div className="mt-2 text-green-300 font-semibold">
              Others owe you ₹{you.net.toFixed(2)} in this group.
            </div>
          );
        } else {
          return (
            <div className="mt-2 text-gray-300 font-semibold">
              You are settled up in this group.
            </div>
          );
        }
      })()}
      {expenses.length > 0 && (
        <div className="mt-8 max-w-xs mx-auto">
          <h2 className="text-xl font-semibold mb-2 text-blue-300">Category-wise Expenses</h2>
          <Pie data={getCategoryData(expenses)} />
        </div>
      )}
      <button
        className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-semibold"
        disabled={sending}
        onClick={async () => {
          setSending(true);
          setSendMsg(null);
          const res = await fetch(`/api/groups/${group._id}/send-summary`, { method: "POST" });
          const data = await res.json();
          setSending(false);
          if (data.success) setSendMsg("Summary sent to your email!");
          else setSendMsg(data.error || "Failed to send summary.");
        }}
      >
        {sending ? "Sending..." : "Send Expense Summary to Email"}
      </button>
      {sendMsg && (
        <div className="mt-2 text-blue-300 font-semibold">{sendMsg}</div>
      )}
      <button
        className="ml-5 mt-6 px-4 py-2 bg-blue-700 rounded"
        onClick={() => router.push("/dashboard")}
      >
        Back to Dashboard
      </button>
    </div>
  );
}