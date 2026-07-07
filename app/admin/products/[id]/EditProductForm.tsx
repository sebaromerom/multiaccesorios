'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// ─── Tipos ────────────────────────────────────────────────────────────────────

type ProductImage = { id: string; url: string; order: number }

type VariantImage = { id?: string; url: string; order: number }

type Variant = {
  id: string
  size: string
  stock: number
  imageUrl?: string | null
  images: VariantImage[]
}

type Product = {
  id: string
  name: string
  description: string | null
  price: number
  stock: number
  imageUrl: string | null
  category: string | null
  images: ProductImage[]
  variants: Variant[]
  branchStocks: { officeId: string; officeName: string; stock: number }[]
}

// ─── Upload helper ────────────────────────────────────────────────────────────

async function uploadFile(file: File): Promise<string | null> {
  const ext      = file.name.split('.').pop()
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const { error } = await supabase.storage.from('products').upload(fileName, file)
  if (error) return null
  const { data } = supabase.storage.from('products').getPublicUrl(fileName)
  return data.publicUrl
}

// ─── Zona de drop reutilizable ────────────────────────────────────────────────

function DropZone({
  images,
  onAdd,
  onRemove,
  label = 'Arrastra imágenes aquí',
}: {
  images: { url: string }[]
  onAdd: (files: File[]) => void
  onRemove: (index: number) => void
  label?: string
}) {
  const inputRef        = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  function handleFiles(files: FileList | File[]) {
    onAdd(Array.from(files).filter(f => f.type.startsWith('image/')))
  }

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files) }}
      className={`border-2 border-dashed rounded p-3 transition-all duration-200 ${
        dragging ? 'border-black bg-zinc-50' : 'border-zinc-300'
      }`}
    >
      {images.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {images.map((img, i) => (
            <div key={i} className="relative group aspect-square">
              <Image
                src={img.url}
                alt=""
                fill
                sizes="120px"
                unoptimized
                className="rounded border border-zinc-200 object-cover"
              />
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="absolute top-1 right-1 min-h-8 min-w-8 bg-black/70 text-white rounded-full flex items-center justify-center text-xs opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                aria-label="Quitar imagen"
              >×</button>
              {i === 0 && (
                <span className="absolute bottom-1 left-1 text-[10px] bg-black/70 text-white px-1 rounded">
                  Principal
                </span>
              )}
            </div>
          ))}
          <div
            onClick={() => inputRef.current?.click()}
            className="aspect-square border border-dashed border-zinc-300 rounded flex items-center justify-center text-zinc-400 text-xs cursor-pointer hover:border-black transition-colors"
          >+ Agregar</div>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          className="flex flex-col items-center justify-center gap-2 py-6 text-zinc-400 cursor-pointer"
        >
          <p className="text-sm">{label}</p>
          <p className="text-xs uppercase tracking-widest">o haz click para seleccionar</p>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={e => e.target.files && handleFiles(e.target.files)}
        className="hidden"
      />
    </div>
  )
}

// ─── Formulario principal ─────────────────────────────────────────────────────

// <-- CAMBIO 1: Agregamos `returnQuery` a las props del componente
export default function EditProductForm({ product, returnQuery }: { product: Product, returnQuery?: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  // Imágenes del producto principal
  const [existingImages, setExistingImages] = useState<ProductImage[]>(product.images ?? [])
  const [newImages,      setNewImages]      = useState<File[]>([])
  const [newPreviews,    setNewPreviews]    = useState<string[]>([])

  // Variantes
  const [variants, setVariants] = useState<Variant[]>(product.variants ?? [])
  // Archivos nuevos por variante: Map de índice de variante → File[]
  const [variantNewFiles, setVariantNewFiles] = useState<Map<number, File[]>>(new Map())
  const [variantPreviews, setVariantPreviews] = useState<Map<number, string[]>>(new Map())

  // ── Producto: imágenes ──────────────────────────────────────────────────────

  function handleProductAdd(files: File[]) {
    setNewImages(prev => [...prev, ...files])
    setNewPreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))])
  }

  function handleProductRemoveExisting(index: number) {
    setExistingImages(prev => prev.filter((_, i) => i !== index))
  }

  function handleProductRemoveNew(index: number) {
    setNewImages(prev => prev.filter((_, i) => i !== index))
    setNewPreviews(prev => prev.filter((_, i) => i !== index))
  }

  const allProductImagePreviews = [
    ...existingImages.map(img => ({ url: img.url })),
    ...newPreviews.map(url => ({ url })),
  ]

  function handleProductRemove(index: number) {
    if (index < existingImages.length) {
      handleProductRemoveExisting(index)
    } else {
      handleProductRemoveNew(index - existingImages.length)
    }
  }

  // ── Variantes: imágenes ─────────────────────────────────────────────────────

  function handleVariantAdd(variantIndex: number, files: File[]) {
    setVariantNewFiles(prev => {
      const next = new Map(prev)
      next.set(variantIndex, [...(prev.get(variantIndex) ?? []), ...files])
      return next
    })
    setVariantPreviews(prev => {
      const next = new Map(prev)
      next.set(variantIndex, [
        ...(prev.get(variantIndex) ?? []),
        ...files.map(f => URL.createObjectURL(f)),
      ])
      return next
    })
  }

  function handleVariantRemove(variantIndex: number, imageIndex: number) {
    const existingCount = variants[variantIndex].images.length
    if (imageIndex < existingCount) {
      // Eliminar imagen existente
      setVariants(prev => prev.map((v, i) =>
        i === variantIndex
          ? { ...v, images: v.images.filter((_, ii) => ii !== imageIndex) }
          : v
      ))
    } else {
      // Eliminar imagen nueva
      const newIndex = imageIndex - existingCount
      setVariantNewFiles(prev => {
        const next = new Map(prev)
        next.set(variantIndex, (prev.get(variantIndex) ?? []).filter((_, i) => i !== newIndex))
        return next
      })
      setVariantPreviews(prev => {
        const next = new Map(prev)
        next.set(variantIndex, (prev.get(variantIndex) ?? []).filter((_, i) => i !== newIndex))
        return next
      })
    }
  }

  function getVariantAllPreviews(variantIndex: number) {
    return [
      ...variants[variantIndex].images.map(img => ({ url: img.url })),
      ...(variantPreviews.get(variantIndex) ?? []).map(url => ({ url })),
    ]
  }

  // ── Submit ──────────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    try {
      const formData   = new FormData(e.currentTarget)
      const name       = formData.get('name') as string
      const description = formData.get('description') as string
      const price      = Number(formData.get('price'))
      const stock      = Number(formData.get('stock'))
      const category   = (document.getElementById('category') as HTMLSelectElement)?.value
      const branchStocks = product.branchStocks.map((branch) => ({
        officeId: branch.officeId,
        officeName: branch.officeName,
        stock: Number(formData.get(`branchStock-${branch.officeId}`) ?? branch.stock),
      }))

      if (!name.trim())  { toast.error('El nombre es obligatorio'); setLoading(false); return }
      if (price <= 0)    { toast.error('El precio debe ser mayor a 0'); setLoading(false); return }

      // Subir imágenes nuevas del producto
      const uploadedProductUrls: string[] = []
      for (const file of newImages) {
        const url = await uploadFile(file)
        if (url) uploadedProductUrls.push(url)
      }

      const allProductImages = [
        ...existingImages.map(img => img.url),
        ...uploadedProductUrls,
      ]

      // Subir imágenes nuevas de variantes y construir payload
      const variantsPayload = await Promise.all(
        variants.map(async (variant, variantIndex) => {
          const newFiles    = variantNewFiles.get(variantIndex) ?? []
          const uploadedUrls: string[] = []

          for (const file of newFiles) {
            const url = await uploadFile(file)
            if (url) uploadedUrls.push(url)
          }

          const allImages = [
            ...variant.images.map(img => ({ url: img.url })),
            ...uploadedUrls.map(url => ({ url })),
          ]

          return {
            id:       variant.id,
            stock:    variant.stock,
            images:   allImages,
          }
        })
      )

      const response = await fetch(`/api/products/${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          price,
          stock,
          imageUrl:  allProductImages[0] ?? product.imageUrl,
          images:    allProductImages,
          category,
          variants:  variantsPayload,
          branchStocks,
        }),
      })

      if (!response.ok) throw new Error()

      toast.success('Producto actualizado')
      
      // <-- CAMBIO 2: Redirigir usando el string mágico que trae los filtros
      if (returnQuery) {
        router.push(`/admin/products?${returnQuery}`)
      } else {
        router.push('/admin/products')
      }
      
      router.refresh()
    } catch {
      toast.error('Error al actualizar producto')
    } finally {
      setLoading(false)
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <Card>
      <CardHeader>
        <CardTitle>Editar Producto</CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          {/* Imágenes del producto */}
          <div className="flex flex-col gap-2">
            <Label>Imágenes del producto</Label>
            <DropZone
              images={allProductImagePreviews}
              onAdd={handleProductAdd}
              onRemove={handleProductRemove}
            />
          </div>

          {/* Nombre */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" name="name" defaultValue={product.name} />
          </div>

          {/* Categoría */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="category">Categoría</Label>
            <select
              id="category"
              name="category"
              defaultValue={product.category ?? ''}
              className="flex h-11 w-full rounded border border-border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="Carcasa">Carcasas</option>
              <option value="Lamina">Láminas</option>
              <option value="Cargador">Cargadores</option>
              <option value="Cable">Cables</option>
              <option value="Audifonos">Audífonos</option>
              <option value="Vapers">Vapers</option>
              <option value="Computacion">Computación</option>
            </select>
          </div>

          {/* Descripción */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="description">Descripción</Label>
            <Input id="description" name="description" defaultValue={product.description ?? ''} />
          </div>

          {/* Precio + Stock */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="price">Precio</Label>
              <Input id="price" name="price" type="number" step="0.01" defaultValue={product.price} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="stock">Stock general</Label>
              <Input id="stock" name="stock" type="number" defaultValue={product.stock} />
            </div>
          </div>

          {product.branchStocks.length > 0 && (
            <div className="flex flex-col gap-2 rounded border border-zinc-200 p-3">
              <Label>Stock por sucursal</Label>
              <div className="grid gap-3 sm:grid-cols-2">
                {product.branchStocks.map((branch) => (
                  <div key={branch.officeId} className="flex flex-col gap-1">
                    <Label htmlFor={`branchStock-${branch.officeId}`} className="text-xs text-zinc-500">
                      {branch.officeName}
                    </Label>
                    <Input
                      id={`branchStock-${branch.officeId}`}
                      name={`branchStock-${branch.officeId}`}
                      type="number"
                      min={0}
                      defaultValue={branch.stock}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Variantes */}
          {variants.length > 0 && (
            <div className="flex flex-col gap-3">
              <Label>Variantes ({variants.length})</Label>
              <div className="flex flex-col gap-4">
                {variants.map((variant, variantIndex) => (
                  <div key={variant.id} className="border rounded-lg p-4 flex flex-col gap-3">

                    {/* Header variante */}
                    <div className="flex items-center justify-between gap-4">
                      <p className="font-medium uppercase tracking-tight text-sm">{variant.size}</p>
                      <div className="flex items-center gap-2">
                        <Label className="text-xs text-zinc-500">Stock</Label>
                        <Input
                          type="number"
                          min={0}
                          value={variant.stock}
                          onChange={e => setVariants(prev =>
                            prev.map((v, i) => i === variantIndex ? { ...v, stock: Number(e.target.value) } : v)
                          )}
                          className="w-24"
                        />
                      </div>
                    </div>

                    {/* Imágenes de la variante con drag & drop */}
                    <div className="flex flex-col gap-1">
                      <p className="text-xs text-zinc-400 uppercase tracking-widest">Imágenes</p>
                      <DropZone
                        images={getVariantAllPreviews(variantIndex)}
                        onAdd={files => handleVariantAdd(variantIndex, files)}
                        onRemove={imageIndex => handleVariantRemove(variantIndex, imageIndex)}
                        label="Arrastra imágenes para esta variante"
                      />
                    </div>

                  </div>
                ))}
              </div>
            </div>
          )}

          <Button type="submit" disabled={loading} className="mt-2">
            {loading ? 'Guardando...' : 'Guardar Cambios'}
          </Button>

        </form>
      </CardContent>
    </Card>
  )
}
