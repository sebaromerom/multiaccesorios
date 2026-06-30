import { redirect } from 'next/navigation'
import { isAdminBypassEnabled } from '@/lib/admin-auth'
import LoginForm from './LoginForm'

export default function LoginPage() {
  if (isAdminBypassEnabled()) {
    redirect('/admin')
  }

  return <LoginForm />
}
