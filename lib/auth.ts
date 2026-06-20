import { NextAuthOptions, DefaultSession } from 'next-auth' // Añadimos DefaultSession aquí
import CredentialsProvider from 'next-auth/providers/credentials'

const LOGIN_WINDOW_MS = 60_000
const LOGIN_MAX_ATTEMPTS = 6
const loginAttempts = new Map<string, { count: number; resetAt: number }>()

function getLoginKey(username?: string | null) {
  return String(username ?? 'unknown').trim().toLowerCase() || 'unknown'
}

function isRateLimited(username?: string | null) {
  const now = Date.now()
  const key = getLoginKey(username)
  const attempt = loginAttempts.get(key)

  if (!attempt || attempt.resetAt <= now) {
    loginAttempts.set(key, { count: 1, resetAt: now + LOGIN_WINDOW_MS })
    return false
  }

  attempt.count += 1
  return attempt.count > LOGIN_MAX_ATTEMPTS
}

function clearLoginAttempts(username?: string | null) {
  loginAttempts.delete(getLoginKey(username))
}

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
        if (isRateLimited(credentials?.username)) {
          console.warn('Admin login rate limit reached', { username: credentials?.username })
          return null
        }

        if (
          credentials?.username === process.env.ADMIN_USERNAME &&
          credentials?.password === process.env.ADMIN_PASSWORD
        ) {
          clearLoginAttempts(credentials?.username)
          return { id: '1', name: 'Admin', role: 'admin' }
        }

        console.warn('Admin login failed', { username: credentials?.username })
        return null
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  cookies: {
    sessionToken: {
      name: `${process.env.NODE_ENV === 'production' ? '__Secure-' : ''}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
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
