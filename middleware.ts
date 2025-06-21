import { withAuth } from "next-auth/middleware";

// This middleware protects all routes except home, login, and signup.
// Only authenticated users can access other routes (like /dashboard).
export default withAuth({
  callbacks: {
    authorized: ({ req, token }) => {
      // Publicly accessible routes
      const publicPaths = ["/", "/login", "/signup", "/forgot-password", "/reset-password"];
      if (publicPaths.includes(req.nextUrl.pathname)) {
        return true;
      }
      // All other routes require authentication
      return !!token;
    },
  },
});

// Specify which routes the middleware should apply to
export const config = {
  matcher: [
    // Match all routes except:
    // - /
    // - /login
    // - /signup
    // - static files (_next, favicon, etc.)
    "/((?!_next/static|_next/image|favicon.ico|login|signup$).*)",
  ],
};