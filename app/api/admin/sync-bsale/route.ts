/**
 * app/api/admin/sync-bsale/route.ts
 * Endpoint protegido para ejecutar la sincronización Bsale → Supabase.
 * Solo accesible desde el panel admin.
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../../lib/auth'
import { syncBsaleToSupabase } from '@/lib/bsale-sync'

export async function POST() {
  try {
    // 1. Obtener la sesión del usuario en el servidor pasando authOptions
    const session = await getServerSession(authOptions)

    // 2. Validar que esté autenticado y que sea Administrador
    if (!session || !session.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { ok: false, error: 'No autorizado. Se requieren permisos de administrador.' },
        { status: 401 }
      )
    }

    // 3. Si pasa la validación, ejecutar la sincronización
    const result = await syncBsaleToSupabase()
    return NextResponse.json({ ok: true, result })

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}