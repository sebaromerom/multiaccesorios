import { NextAuthOptions, DefaultSession } from 'next-auth' // Añadimos DefaultSession aquí
import CredentialsProvider from 'next-auth/providers/credentials'

// ── EXTENSIÓN DE TIPOS PARA NEXTAUTH (CORREGIDO) ──
declare module "next-auth" {
  interface User {
    role?: string;
  }

  interface Session {
    user: {
      id?: string;
      role?: string;
    } & DefaultSession["user"]; // Combinamos las propiedades nativas con nuestro rol personalizado
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
  }
}

// ── EL RESTO DE TU CONFIGURACIÓN SIGUE IGUAL ──
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        username: { label: 'Usuario', type: 'text' },
        password: { label: 'Contrasena', type: 'password' },
      },
      async authorize(credentials) {
        if (
          credentials?.username === process.env.ADMIN_USERNAME &&
          credentials?.password === process.env.ADMIN_PASSWORD
        ) {
          return { id: '1', name: 'Admin', role: 'admin' }
        }
        return null
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role // <-- ¡Aquí es donde desaparece el error!
      }
      return session
    },
  },
  pages: {
    signIn: '/admin/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
}