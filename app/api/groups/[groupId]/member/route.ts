import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Group } from "@/models/Group";
import { User } from "@/models/Users";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req: NextRequest, { params }: { params: { groupId: string } }) {
  await connectDB();
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { memberId, action } = await req.json();
  const group = await Group.findById(params.groupId);
  if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 });

  // Only creator can add/remove members
  const user = await User.findOne({ email: session.user!.email });
  if (!user || group.creator.toString() !== user._id.toString()) {
    return NextResponse.json({ error: "Only group creator can modify members" }, { status: 403 });
  }

  if (action === "add") {
    if (!group.members.includes(memberId)) group.members.push(memberId);
  } else if (action === "remove") {
    group.members = group.members.filter((id: string) => id.toString() !== memberId);
  } else {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }
  await group.save();
  return NextResponse.json({ success: true, members: group.members });
}