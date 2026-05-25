import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth' // Ajusta si lo creaste en @/app/auth

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }