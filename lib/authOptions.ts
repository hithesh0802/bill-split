import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import type { SessionStrategy } from "next-auth";
import { User } from "@/models/Users";
import { connectDB } from "@/lib/db";
import bcrypt from "bcryptjs";
import type { Session, User as NextAuthUser } from "next-auth";
import type { JWT } from "next-auth/jwt";
import type { Account, Profile } from "next-auth";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        await connectDB();
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing email or password.");
        }
        const user = await User.findOne({ email: credentials.email });
        if (!user) throw new Error("User not found.");
        if (!user.password) throw new Error("Please sign in with Google.");
        const isMatch = await bcrypt.compare(credentials.password, user.password);
        if (!isMatch) throw new Error("Invalid password.");
        return {
          id: user._id.toString(),
          name: user.username,
          email: user.email,
        };
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "jwt" as SessionStrategy,
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({
        account,
        profile,
    }: {
        account: Account | null;
        profile?: Profile;
    }) {
      if (account?.provider === "google" && profile?.email) {
        await connectDB();
        const existingUser = await User.findOne({ email: profile.email });
        if (!existingUser) {
          await User.create({
            username: profile.name || profile.email.split("@")[0],
            email: profile.email,
            password: "",
          });
        }
      }
      return true;
    },
    async jwt({
        token,
        user,
    }: {
        token: JWT;
        user?: NextAuthUser;
    }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({
        session,
        token,
    }: {
        session: Session;
        token: JWT;
    }) {
        if (token && session.user) {
            (session.user as { id?: string }).id = token.id as string;
        }
        return session;
    },
  },
};