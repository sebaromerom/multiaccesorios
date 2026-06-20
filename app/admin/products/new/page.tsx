'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export default function NewProductPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [images, setImages] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFiles(files: FileList | File[]) {
    const arr = Array.from(files).filter(f => f.type.startsWith('image/'))
    const newPreviews = arr.map(f => URL.createObjectURL(f))
    setImages(prev => [...prev, ...arr])
    setPreviews(prev => [...prev, ...newPreviews])
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) handleFiles(e.target.files)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    if (e.dataTransfer.files) handleFiles(e.dataTransfer.files)
  }

  function removeImage(index: number) {
    setImages(prev => prev.filter((_, i) => i !== index))
    setPreviews(prev => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const price = Number(formData.get('price'))
    const stock = Number(formData.get('stock'))
    const category = formData.get('category')

    // Validaciones básicas
    if (!name.trim()) { toast.error('El nombre es obligatorio'); setLoading(false); return }
    if (price <= 0) { toast.error('El precio debe ser mayor a 0'); setLoading(false); return }
    if (stock < 0) { toast.error('El stock no puede ser negativo'); setLoading(false); return }
    if (!category) { toast.error('Selecciona una categoría'); setLoading(false); return }

    const uploadedUrls: string[] = []

    try {
      for (const image of images) {
        const ext = image.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
        const { error } = await supabase.storage.from('products').upload(fileName, image)
        if (!error) {
          const { data } = supabase.storage.from('products').getPublicUrl(fileName)
          uploadedUrls.push(data.publicUrl)
        }
      }

      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          price,
          stock,
          imageUrl: uploadedUrls[0] ?? null,
          images: uploadedUrls,
          category,
          variants: [] // Enviamos array vacío para no romper la API si aún lo espera
        }),
      })

      if (!response.ok) throw new Error('Error al guardar en la base de datos')

      toast.success('Producto guardado correctamente')
      router.push('/admin/products')
      router.refresh()
    } catch (error) {
      console.error(error)
      toast.error('Ocurrió un error al guardar el producto')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-lg">
        <div className="mb-6">
          <h1 className="admin-page-title">Agregar producto</h1>
          <p className="admin-page-kicker">Crea un nuevo producto para el catálogo.</p>
        </div>
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-sm uppercase tracking-widest text-muted-foreground">Detalles del Producto</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              
              {/* SECCIÓN DE IMÁGENES */}
              <div className="flex flex-col gap-2">
                <Label>Imágenes</Label>
                <div
                  onClick={() => inputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                  className={`
                    relative cursor-pointer border-2 border-dashed rounded-lg
                    transition-all duration-200 p-4 min-h-[150px] flex items-center justify-center
                    ${dragging ? 'border-foreground bg-secondary' : 'border-border hover:border-muted-foreground'}
                  `}
                >
                  {previews.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 w-full">
                      {previews.map((src, i) => (
                        <div key={i} className="relative group aspect-square">
                          <Image
                            src={src}
                            alt="Preview"
                            fill
                            sizes="120px"
                            unoptimized
                            className="rounded-md object-cover"
                          />
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); removeImage(i) }}
                            className="absolute -top-2 -right-2 min-h-8 min-w-8 bg-red-600 text-white rounded-full flex items-center justify-center text-xs shadow-lg"
                            aria-label="Quitar imagen"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      <div className="aspect-square border border-dashed border-border rounded-md flex items-center justify-center text-muted-foreground text-xs hover:bg-secondary transition-colors">
                        + Añadir
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <p className="text-sm">Arrastra o haz click para subir fotos</p>
                    </div>
                  )}
                  <input ref={inputRef} type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" />
                </div>
              </div>

              {/* CAMPOS DE TEXTO */}
              <div className="grid gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="name">Nombre del Producto</Label>
                  <Input id="name" name="name" placeholder="Ej: Carcasa Silicona iPhone 15" />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="category">Categoría</Label>
                  <select
                    id="category"
                    name="category"
                    required
                    className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Selecciona una categoría</option>
                    <option value="Carcasa">Carcasa</option>
                    <option value="Lamina">Lámina</option>
                    <option value="Cargador">Cargador</option>
                    <option value="Cable">Cable</option>
                    <option value="Audifonos">Audífonos</option>
                    <option value="Vapers">Vapers</option>
                    <option value="Computacion">Computación</option>
                    <option value="Otros">Otros</option>
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Input id="description" name="description" placeholder="Breve descripción del producto..." />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="price">Precio ($)</Label>
                    <Input id="price" name="price" type="number" placeholder="9990" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="stock">Stock Total</Label>
                    <Input id="stock" name="stock" type="number" placeholder="10" defaultValue={0} />
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full py-6 text-base font-bold uppercase tracking-widest bg-red-600 hover:bg-red-700" 
                disabled={loading}
              >
                {loading ? 'Subiendo...' : 'Guardar Producto'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
