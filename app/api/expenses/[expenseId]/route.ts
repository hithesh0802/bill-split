import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Expense } from "@/models/Expense";
import { Group } from "@/models/Group";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { expenseId: string } }
) {
  await connectDB();
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const expense = await Expense.findById(params.expenseId);
  if (!expense) return NextResponse.json({ error: "Expense not found" }, { status: 404 });

  // Only the user who added the expense can delete it
  if (expense.paidBy.toString() !== session?.user?.email) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  // Remove from group's expenses array
  await Group.updateOne(
    { _id: expense.group },
    { $pull: { expenses: expense._id } }
  );

  await expense.deleteOne();
  return NextResponse.json({ success: true });
}