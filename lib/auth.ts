import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt", maxAge: 60 * 60 * 8 },
  pages: { signIn: "/login" },
  providers: [Credentials({
    credentials: { email: {}, password: {} },
    async authorize(input) {
      const parsed = z.object({ email: z.string().email(), password: z.string().min(1) }).safeParse(input);
      if (!parsed.success) return null;
      const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase().trim() } });
      if (!user?.active || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) return null;
      await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
      return { id: user.id, email: user.email, name: user.name, role: user.role };
    }
  })],
  callbacks: {
    jwt: ({ token, user }) => { if (user) token.role = user.role; return token; },
    session: ({ session, token }) => { if (session.user) { session.user.id = token.sub!; session.user.role = token.role as "SUPER_ADMIN" | "OPERATOR"; } return session; }
  }
});
