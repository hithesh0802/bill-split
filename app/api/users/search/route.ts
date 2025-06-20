import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/Users";

export async function GET(req: NextRequest) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");
  if (!q) return NextResponse.json([], { status:200 });

  // Populate friends with user objects
  const users = await User.find({
    $or: [
        { username: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } }
    ]
    })
    .select("username email _id friends")
    .populate("friends", "username email _id");
  return NextResponse.json(users);
}