import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/Users";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: NextRequest) {
  await connectDB();
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 }
  // Parse multipart form data
  const formData = await req.formData();
  const file = formData.get("profilePic") as File;
  if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = `${session.user.email.replace(/[^a-zA-Z0-9]/g, "_")}_${Date.now()}.jpg`;
  const uploadDir = path.join(process.cwd(), "public", "profile-pics");

  // Ensure the directory exists
  await mkdir(uploadDir, { recursive: true });

  await writeFile(path.join(uploadDir, filename), buffer);

  const url = `/profile-pics/${filename}`;
  await User.findOneAndUpdate(
    { email: session?.user?.email },
    { profilePic: url }
  );

  return NextResponse.json({ success: true, url });
}