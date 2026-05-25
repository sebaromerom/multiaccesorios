'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
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

    const result = await signIn('credentials', {
      username: formData.get('username'),
      password: formData.get('password'),
      redirect: false,
    })

    if (result?.error) {
      setError('Usuario o contraseña incorrectos')
      setLoading(false)
    } else {
      router.push('/admin')
      router.refresh()
    }
  }

  return (
    // Agregamos la clase 'es-ruta-admin' para accionar los cambios visuales en la raíz
    <div className="es-ruta-admin min-h-screen w-full flex items-center justify-center bg-zinc-950 p-4">
      <div className="w-full max-w-sm">
        
        <h1 className="text-5xl mb-8 text-center text-white font-black uppercase tracking-tighter italic">
          Admin
        </h1>
        
        <Card className="bg-zinc-900 border-zinc-800 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-white text-xl font-bold uppercase tracking-wide">
              Iniciar sesión
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              
              <div className="flex flex-col gap-2">
                <Label htmlFor="username" className="text-zinc-300 font-medium text-xs tracking-wider uppercase">
                  Usuario
                </Label>
                <Input 
                  id="username" 
                  name="username" 
                  required 
                  className="bg-zinc-800 text-white border-zinc-700 focus:border-white focus:ring-0 h-10"
                />
              </div>
              
              <div className="flex flex-col gap-2">
                <Label htmlFor="password" className="text-zinc-300 font-medium text-xs tracking-wider uppercase">
                  Contraseña
                </Label>
                <Input 
                  id="password" 
                  name="password" 
                  type="password" 
                  required 
                  className="bg-zinc-800 text-white border-zinc-700 focus:border-white focus:ring-0 h-10"
                />
              </div>
              
              {error && (
                <p className="text-sm text-red-500 font-semibold">{error}</p>
              )}
              
              <Button 
                type="submit" 
                disabled={loading}
                className="w-full h-11 bg-[#ff0066] hover:bg-[#e6005c] text-white text-xs tracking-[0.2em] font-black uppercase rounded-sm transition-all duration-200"
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