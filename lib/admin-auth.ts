import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'

export async function isAdminRequest() {
  const session = await getServerSession(authOptions)
  return session?.user?.role === 'admin'
}

export async function requireAdminPage() {
  if (!(await isAdminRequest())) {
    redirect('/admin/login')
  }
}

export function adminUnauthorizedResponse() {
  return NextResponse.json(
    { ok: false, error: 'No autorizado. Se requieren permisos de administrador.' },
    { status: 401 }
  )
}
