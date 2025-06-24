import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Group } from "@/models/Group";
import { User } from "@/models/Users";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function GET() {
  await connectDB();
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await User.findOne({ email: session.user!.email });
  if (!user) return NextResponse.json({ groups: [] });

  // Populate members with user objects
  const groups = await Group.find({ members: user._id })
    .populate("members", "username email _id")
    .populate("creator", "username email _id")
    .lean();
  return NextResponse.json({ groups });
}