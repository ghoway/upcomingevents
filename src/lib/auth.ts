import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcryptjs from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findFirst({
          where: {
            username: credentials.username as string,
            deletedAt: null,
          },
          include: {
            employee: {
              include: {
                department: true,
              },
            },
          },
        });

        if (!user) return null;

        const isValid = await bcryptjs.compare(
          credentials.password as string,
          user.password
        );

        if (!isValid) return null;

        return {
          id: user.id,
          name: user.employee?.name || user.username,
          email: user.username, // using email field to pass username
          role: user.role,
          employeeId: user.employeeId,
          departmentId: user.employee?.departmentId,
          departmentName: user.employee?.department?.name,
        } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.role = (user as any).role;
        token.employeeId = (user as any).employeeId;
        token.departmentId = (user as any).departmentId;
        token.departmentName = (user as any).departmentName;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).employeeId = token.employeeId;
        (session.user as any).departmentId = token.departmentId;
        (session.user as any).departmentName = token.departmentName;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET || 'upcomingevents-secret-key-change-in-production',
});
