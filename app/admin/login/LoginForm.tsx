'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function LoginForm() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)

    try {
      const callbackUrl =
        typeof window !== 'undefined'
          ? new URLSearchParams(window.location.search).get('callbackUrl') || '/admin'
          : '/admin'

      const response = await Promise.race([
        fetch('/api/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: formData.get('username'),
            password: formData.get('password'),
          }),
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Tiempo de espera agotado')), 15_000),
        ),
      ])

      if (!response.ok) {
        setError('Usuario o contrasena incorrectos')
        setLoading(false)
        return
      }

      router.push(callbackUrl)
      router.refresh()
    } catch (loginError) {
      console.error('Admin login error', loginError)
      setError('No se pudo iniciar sesion. Revisa las variables del admin en Vercel.')
      setLoading(false)
    }
  }

  return (
    <div className="es-ruta-admin flex min-h-screen w-full items-center justify-center bg-white px-4 py-10 text-neutral-950">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center justify-center gap-4">
          <Image
            src="/multi.jpeg"
            alt="Multi Accesorios"
            width={76}
            height={76}
            priority
            className="h-16 w-16 rounded-[14px] object-cover"
          />
          <div className="leading-none">
            <p className="text-3xl font-black uppercase tracking-tight">Multi</p>
            <p className="text-3xl font-black uppercase tracking-tight">Accesorios</p>
          </div>
        </div>

        <Card className="rounded-md border-neutral-200 bg-white shadow-[0_18px_60px_rgba(0,0,0,0.10)]">
          <CardHeader className="space-y-2 border-b border-neutral-100 pb-5">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-red-600">
              Panel administrativo
            </p>
            <CardTitle className="text-2xl font-black uppercase tracking-tight text-neutral-950">
              Iniciar sesión
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label
                  htmlFor="username"
                  className="text-xs font-black uppercase tracking-[0.14em] text-neutral-600"
                >
                  Usuario
                </Label>
                <Input
                  id="username"
                  name="username"
                  required
                  className="h-12 rounded-md border-neutral-200 bg-white text-base text-neutral-950 focus:border-red-600 focus:ring-0"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label
                  htmlFor="password"
                  className="text-xs font-black uppercase tracking-[0.14em] text-neutral-600"
                >
                  Contraseña
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="h-12 rounded-md border-neutral-200 bg-white text-base text-neutral-950 focus:border-red-600 focus:ring-0"
                />
              </div>

              {error && <p className="text-sm font-semibold text-red-500">{error}</p>}

              <Button
                type="submit"
                disabled={loading}
                className="mt-2 h-12 w-full rounded-md bg-red-600 text-sm font-black uppercase tracking-[0.12em] text-white transition-all duration-200 hover:bg-red-700"
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
