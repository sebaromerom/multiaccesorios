import { NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/admin-auth'
import { enrichMissingProductImages, enrichMissingVariantImages } from '@/lib/image-enrichment'

export async function POST(req: Request) {
  try {
    if (!(await isAdminRequest())) {
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
    const variants = await enrichMissingVariantImages({
      limit: Number(body.variantLimit ?? body.limit ?? 25),
      overwrite: Boolean(body.overwrite ?? false),
      concurrency: Number(body.concurrency ?? 6),
    })

    return NextResponse.json({ ok: true, result, variants })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
