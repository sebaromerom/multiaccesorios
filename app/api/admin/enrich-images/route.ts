import { NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/admin-auth'
import { Category } from '@prisma/client'
import { enrichMissingProductImages, enrichMissingVariantImages, repairCategoryProductImages, repairCategoryVariantImages } from '@/lib/image-enrichment'
import { migrateStoredExternalImages, repairImportedImageAssets } from '@/lib/imported-images'

export async function POST(req: Request) {
  try {
    if (!(await isAdminRequest())) {
      return NextResponse.json(
        { ok: false, error: 'No autorizado. Se requieren permisos de administrador.' },
        { status: 401 }
      )
    }

    const body = await req.json().catch(() => ({}))
    if (body.mode === 'migrate-existing') {
      const migrated = await migrateStoredExternalImages(Number(body.limit ?? 25), body.productId)
      return NextResponse.json({ ok: true, migrated })
    }
    if (body.mode === 'repair-imported') {
      const repaired = await repairImportedImageAssets(Number(body.limit ?? 50), body.productId)
      return NextResponse.json({ ok: true, repaired })
    }
    if (body.mode === 'repair-category-variants') {
      const category = String(body.category ?? '')
      if (!(category in Category)) {
        return NextResponse.json({ ok: false, error: 'Categoria invalida' }, { status: 400 })
      }
      const repaired = await repairCategoryVariantImages(Category[category as keyof typeof Category], Number(body.limit ?? 30))
      return NextResponse.json({ ok: true, repaired })
    }
    if (body.mode === 'repair-category-products') {
      const category = String(body.category ?? '')
      if (!(category in Category)) {
        return NextResponse.json({ ok: false, error: 'Categoria invalida' }, { status: 400 })
      }
      const repaired = await repairCategoryProductImages(Category[category as keyof typeof Category], Number(body.limit ?? 30))
      return NextResponse.json({ ok: true, repaired })
    }

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
