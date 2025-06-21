import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Expense } from "@/models/Expense";
import { Group } from "@/models/Group";
import { User } from "@/models/Users";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req: NextRequest) {
  await connectDB();
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { groupId, amount, category, description } = await req.json();
  const user = await User.findOne({ email: session?.user?.email });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const group = await Group.findById(groupId);
  if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 });

  // Only group members can add expenses
  if (!group.members.map(id => id.toString()).includes(user._id.toString())) {
    return NextResponse.json({ error: "Not a group member" }, { status: 403 });
  }

  const expense = await Expense.create({
    group: groupId,
    paidBy: user._id,
    amount,
    category,
    description
  });

  // Optionally add expense to group's expenses array
  group.expenses = group.expenses || [];
  group.expenses.push(expense._id);
  await group.save();

  return NextResponse.json({ expense });
}