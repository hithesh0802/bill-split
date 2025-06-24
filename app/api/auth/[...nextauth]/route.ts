import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { connectDB } from "@/lib/db";
import { User } from "@/models/Users";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
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

        // If user was created via Google OAuth, password will be empty
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
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Only handle Google sign-in
      if (account?.provider === "google" && profile?.email) {
        await connectDB();
        // Check if user already exists
        const existingUser = await User.findOne({ email: profile.email });
        if (!existingUser) {
          // Create new user for Google sign-in
          await User.create({
            username: profile.name || profile.email.split("@")[0],
            email: profile.email,
            password: "", // No password for OAuth users
          });
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      // Attach user id to token if available
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      // Attach user id to session if available
      if (token && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };