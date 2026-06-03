import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { enrichMissingProductImages } from '@/lib/image-enrichment'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json(
        { ok: false, error: 'No autorizado. Se requieren permisos de administrador.' },
        { status: 401 }
      )
    }

    const body = await req.json().catch(() => ({}))
    const result = await enrichMissingProductImages({
      limit: Number(body.limit ?? 25),
      overwrite: Boolean(body.overwrite ?? false),
    })

    return NextResponse.json({ ok: true, result })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
