import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Group } from "@/models/Group";
import { User } from "@/models/Users";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function DELETE(req: NextRequest, { params }: { params: { groupId: string } }) {
  await connectDB();
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const group = await Group.findById(params.groupId);
  if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 });

  // Only creator can delete group
  const user = await User.findOne({ email: session.user!.email });
  if (!user || group.creator.toString() !== user._id.toString()) {
    return NextResponse.json({ error: "Only group creator can delete group" }, { status: 403 });
  }

  await group.deleteOne();
  return NextResponse.json({ success: true });
}