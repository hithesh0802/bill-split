import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Expense } from "@/models/Expense";
import { Group } from "@/models/Group";
import { User } from "@/models/Users";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import nodemailer from "nodemailer";

type MemberType = { _id: string; username: string; email: string };

export async function POST(req: NextRequest, { params }: { params: { groupId: string } }) {
  await connectDB();
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { groupId } = params;
  const group = await Group.findById(groupId).populate("members", "username email _id");
  if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 });

  // Only group members can request summary
  const user = await User.findOne({ email: session.user.email });
  if (
    !user ||
    !group.members.some(
        (m: MemberType) => m._id.toString() === user._id.toString()
    )
) {
        return NextResponse.json({ error: "Not a group member" }, { status: 403 });
    }

  const expenses = await Expense.find({ group: groupId }).lean();

  // Prepare summary
  let summary = `Expense Summary for Group: ${group.name}\n\n`;
  if (expenses.length === 0) {
    summary += "No expenses recorded.";
  } else {
    summary += "Category-wise Expenses:\n";
    const categoryTotals: Record<string, number> = {};
    expenses.forEach(exp => {
      categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
    });
    Object.entries(categoryTotals).forEach(([cat, amt]) => {
      summary += `- ${cat}: ₹${amt}\n`;
    });
    summary += "\nDetailed Expenses:\n";
    expenses.forEach(exp => {
      summary += `• ₹${exp.amount} - ${exp.category}`;
      if (exp.description) summary += ` (${exp.description})`;
      summary += "\n";
    });
  }

  // Send email
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    to: session.user.email,
    subject: `Expense Summary for Group: ${group.name}`,
    text: summary,
  });

  return NextResponse.json({ success: true });
}