import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Lock, LogIn, User } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/Button'
import { Input, Field } from '@/components/ui/Input'
import { Logo } from '@/components/ui/Logo'
import { COMPANY } from '@/data/mockData'

export function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { error } = await login(identifier, password)
    setLoading(false)
    if (error) {
      toast.error(error)
      return
    }
    toast.success('Welcome back!')
    navigate('/')
  }

  return (
    <div className="flex min-h-screen">
      {/* Brand panel */}
      <div className="relative hidden w-1/2 flex-col justify-between bg-brand-charcoal p-12 text-white lg:flex">
        <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, #E11D2A 0, transparent 45%), radial-gradient(circle at 80% 80%, #2B36D6 0, transparent 45%)' }} />
        <div className="relative">
          <div className="inline-flex rounded-2xl bg-white px-4 py-3">
            <Logo className="h-11" />
          </div>
        </div>
        <div className="relative">
          <h1 className="text-4xl font-extrabold leading-tight">
            Workshop Command<br />Center
          </h1>
          <p className="mt-4 max-w-md text-slate-400">
            Manage customers, vehicles, job cards, inventory, billing and staff — the complete car service CRM built for {COMPANY.name}.
          </p>
          <div className="mt-8 flex flex-wrap gap-2">
            {['Job Cards', 'GST Invoicing', 'Spare Parts', 'WhatsApp', 'Reports'].map((t) => (
              <span key={t} className="rounded-full bg-white/10 px-3 py-1 text-sm text-slate-200">{t}</span>
            ))}
          </div>
        </div>
        <p className="relative text-xs text-slate-500">Multi Brand Car Service Centre · Kanchipuram, Tamil Nadu</p>
      </div>

      {/* Form panel */}
      <div className="flex w-full flex-col items-center justify-center bg-surface-page px-6 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center lg:hidden">
            <Logo className="h-14" />
          </div>

          <h2 className="text-2xl font-extrabold text-brand-charcoal">Sign in</h2>
          <p className="mt-1 text-sm text-slate-500">Use your username or email to continue.</p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <Field label="Username or Email">
              <Input
                icon={<User className="h-4 w-4" />}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="manager"
                autoComplete="username"
                required
              />
            </Field>
            <Field label="Password">
              <div className="relative">
                <Input
                  icon={<Lock className="h-4 w-4" />}
                  type={show ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  className="pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShow((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </Field>

            <div className="flex justify-end">
              <button type="button" className="text-sm font-semibold text-brand-red hover:underline">
                Forgot password?
              </button>
            </div>

            <Button type="submit" size="lg" className="w-full" loading={loading}>
              <LogIn className="h-4 w-4" />
              Sign in
            </Button>
          </form>

          <p className="mt-8 text-center text-xs text-slate-400">
            © {new Date().getFullYear()} {COMPANY.name}. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}
