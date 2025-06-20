import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/Users";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { friendId, action } = await req.json();
    const user = await User.findOne({ email: session.user!.email });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    if (action === "add") {
      if (!user.friends) user.friends = [];
      if (!user.friends.includes(friendId)) user.friends.push(friendId);
      console.log(`Friend added: ${friendId} to user ${user.email}`);
    } else if (action === "remove") {
      if (!user.friends) user.friends = [];
      user.friends = user.friends.filter((id: string) => id.toString() !== friendId);
      console.log(`Friend removed: ${friendId} from user ${user.email}`);
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
    await user.save();

    // Populate friends with username and email
    const populatedUser = await User.findById(user._id).populate("friends", "username email _id");
    return NextResponse.json({
      success: true,
      friends: populatedUser.friends,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}