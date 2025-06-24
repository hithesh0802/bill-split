import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Group } from "@/models/Group";
import { User } from "@/models/Users";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function POST(req: NextRequest) {
  await connectDB();
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, memberIds } = await req.json();
  const creator = await User.findOne({ email: session.user!.email });
  if (!creator) return NextResponse.json({ error: "Creator not found" }, { status: 404 });

  // Only allow adding friends
  const validMembers = memberIds.filter((id: string) => creator.friends.map(f => f.toString()).includes(id));
  const group = await Group.create({
    name,
    creator: creator._id,
    members: [creator._id, ...validMembers],
    expenses: [],
  });

  return NextResponse.json(group);
}