'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'

type ProductImage = {
  id: string
  url: string
  order: number
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
}

export default function EditProductForm({ product }: { product: Product }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [existingImages, setExistingImages] = useState<ProductImage[]>(product.images ?? [])
  const [newImages, setNewImages] = useState<File[]>([])
  const [newPreviews, setNewPreviews] = useState<string[]>([])
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFiles(files: FileList | File[]) {
    const arr = Array.from(files).filter(f => f.type.startsWith('image/'))
    const previews = arr.map(f => URL.createObjectURL(f))
    setNewImages(prev => [...prev, ...arr])
    setNewPreviews(prev => [...prev, ...previews])
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) handleFiles(e.target.files)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    if (e.dataTransfer.files) handleFiles(e.dataTransfer.files)
  }

  function removeExisting(id: string) {
    setExistingImages(prev => prev.filter(img => img.id !== id))
  }

  function removeNew(index: number) {
    setNewImages(prev => prev.filter((_, i) => i !== index))
    setNewPreviews(prev => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const price = Number(formData.get('price'))
    const stock = Number(formData.get('stock'))

    if (!name.trim()) { toast.error('El nombre es obligatorio'); setLoading(false); return }
    if (price <= 0) { toast.error('El precio debe ser mayor a 0'); setLoading(false); return }
    if (stock < 0) { toast.error('El stock no puede ser negativo'); setLoading(false); return }

    const uploadedUrls: string[] = []

    for (const image of newImages) {
      const ext = image.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage.from('products').upload(fileName, image)
      if (!error) {
        const { data } = supabase.storage.from('products').getPublicUrl(fileName)
        uploadedUrls.push(data.publicUrl)
      }
    }

    const allImages = [
      ...existingImages.map(img => img.url),
      ...uploadedUrls,
    ]

    await fetch(`/api/products/${product.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        description,
        price,
        stock,
        imageUrl: allImages[0] ?? product.imageUrl,
        images: allImages,
        category: (document.getElementById('category') as HTMLSelectElement)?.value ?? null,
      }),
    })

    toast.success('Producto actualizado')
    router.push('/admin/products')
    router.refresh()
  }

  const totalImages = existingImages.length + newPreviews.length

  return (
    <Card>
      <CardHeader><CardTitle>Editar Producto</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          <div className="flex flex-col gap-2">
            <Label>Imágenes del producto</Label>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              className={`
                border-2 border-dashed rounded p-4 transition-all duration-200
                ${dragging ? 'border-foreground bg-secondary' : 'border-border'}
              `}
            >
              {totalImages > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {existingImages.map((img, i) => (
                    <div key={img.id} className="relative group aspect-square">
                      <img src={img.url} className="w-full h-full object-cover rounded" />
                      <button
                        type="button"
                        onClick={() => removeExisting(img.id)}
                        className="absolute top-1 right-1 w-5 h-5 bg-black/70 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                      {i === 0 && existingImages.length > 0 && (
                        <span className="absolute bottom-1 left-1 text-xs bg-black/70 text-white px-1 rounded">Principal</span>
                      )}
                    </div>
                  ))}
                  {newPreviews.map((src, i) => (
                    <div key={`new-${i}`} className="relative group aspect-square">
                      <img src={src} className="w-full h-full object-cover rounded" />
                      <button
                        type="button"
                        onClick={() => removeNew(i)}
                        className="absolute top-1 right-1 w-5 h-5 bg-black/70 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                      <span className="absolute bottom-1 left-1 text-xs bg-blue-500/70 text-white px-1 rounded">Nueva</span>
                    </div>
                  ))}
                  <div
                    onClick={() => inputRef.current?.click()}
                    className="aspect-square border border-dashed border-border rounded flex items-center justify-center text-muted-foreground text-xs cursor-pointer hover:border-foreground transition-colors"
                  >
                    + Agregar
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => inputRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-3 py-8 text-muted-foreground cursor-pointer"
                >
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <path d="M21 15l-5-5L5 21"/>
                  </svg>
                  <div className="text-center">
                    <p className="text-sm">Arrastra imágenes aquí</p>
                    <p className="text-xs mt-1 tracking-widest uppercase">o haz click para seleccionar</p>
                  </div>
                </div>
              )}
              <input ref={inputRef} type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" name="name" defaultValue={product.name} />
          </div>
          
          <div className="flex flex-col gap-2">
            <Label htmlFor="category">Categoria</Label>
            <select
              id="category"
              name="category"
              defaultValue={product.category ?? ''}
              className="flex h-9 w-full rounded border border-border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">Sin categoria</option>
              <option value="real-madrid">Real Madrid</option>
              <option value="barcelona">Barcelona</option>
              <option value="manchester-united">Manchester United</option>
              <option value="liverpool">Liverpool</option>
              <option value="juventus">Juventus</option>
              <option value="bayern">Bayern Munich</option>
              <option value="psg">PSG</option>
              <option value="seleccion-chile">Seleccion Chile</option>
              <option value="seleccion-argentina">Seleccion Argentina</option>
              <option value="seleccion-brasil">Seleccion Brasil</option>
              <option value="retro">Retro</option>
              <option value="edicion-especial">Edicion especial</option>
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="description">Descripción</Label>
            <Input id="description" name="description" defaultValue={product.description ?? ''} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="price">Precio</Label>
            <Input id="price" name="price" type="number" step="0.01" defaultValue={product.price} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="stock">Stock</Label>
            <Input id="stock" name="stock" type="number" defaultValue={product.stock} />
          </div>

          <Button type="submit" disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}