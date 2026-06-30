import { NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/admin-auth'
import { syncBsaleToSupabase } from '@/lib/bsale-sync'

export async function POST() {
  try {
    if (!(await isAdminRequest())) {
      return NextResponse.json(
        { ok: false, error: 'No autorizado. Se requieren permisos de administrador.' },
        { status: 401 },
      )
    }

    const result = await syncBsaleToSupabase()
    return NextResponse.json({ ok: true, result })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
