import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

function getAuthSecret() {
  if (!process.env.NEXTAUTH_SECRET && process.env.NODE_ENV === 'production') {
    throw new Error('NEXTAUTH_SECRET is required in production.');
  }

  return process.env.NEXTAUTH_SECRET || 'development-only-secret';
}

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Correo Electrónico',
      credentials: {
        email: { label: 'Correo', type: 'email' },
        password: { label: 'Contraseña', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Faltan credenciales');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.trim().toLowerCase() }
        });

        if (!user) {
          throw new Error('No existe una cuenta con este correo');
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);

        if (!isValid) {
          throw new Error('Contraseña incorrecta');
        }

        return { id: user.id, email: user.email, name: user.name };
      }
    })
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
  },
  secret: getAuthSecret(),
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
