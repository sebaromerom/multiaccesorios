'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function LoginPage() {
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
    <div className="es-ruta-admin flex min-h-screen w-full items-center justify-center bg-zinc-950 p-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-8 text-center text-5xl font-black uppercase italic tracking-tighter text-white">
          Admin
        </h1>

        <Card className="border-zinc-800 bg-zinc-900 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-xl font-bold uppercase tracking-wide text-white">
              Iniciar sesion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label
                  htmlFor="username"
                  className="text-xs font-medium uppercase tracking-wider text-zinc-300"
                >
                  Usuario
                </Label>
                <Input
                  id="username"
                  name="username"
                  required
                  className="h-10 border-zinc-700 bg-zinc-800 text-white focus:border-white focus:ring-0"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label
                  htmlFor="password"
                  className="text-xs font-medium uppercase tracking-wider text-zinc-300"
                >
                  Contrasena
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="h-10 border-zinc-700 bg-zinc-800 text-white focus:border-white focus:ring-0"
                />
              </div>

              {error && <p className="text-sm font-semibold text-red-500">{error}</p>}

              <Button
                type="submit"
                disabled={loading}
                className="h-11 w-full rounded-sm bg-[#ff0066] text-xs font-black uppercase tracking-[0.2em] text-white transition-all duration-200 hover:bg-[#e6005c]"
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
