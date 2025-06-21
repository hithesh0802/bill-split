import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Expense } from "@/models/Expense";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(req: NextRequest, { params }: { params: { groupId: string } }) {
  const { groupId } = params;
  await connectDB();
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const expenses = await Expense.find({ group: groupId })
    .populate("paidBy", "username email _id")
    .sort({ createdAt: -1 })
    .lean();
  return NextResponse.json({ expenses });
}