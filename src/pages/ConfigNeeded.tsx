import { Database } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'

/** Shown when Supabase env vars are missing. Prevents a blank/crashed screen. */
export function ConfigNeeded() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-page px-6">
      <div className="w-full max-w-md rounded-2xl border border-surface-border bg-white p-8 text-center shadow-card">
        <div className="mb-4 flex justify-center"><Logo className="h-12" /></div>
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-redLight text-brand-red">
          <Database className="h-6 w-6" />
        </div>
        <h1 className="text-lg font-extrabold text-brand-charcoal">Connect Supabase to continue</h1>
        <p className="mt-2 text-sm text-slate-500">
          Add your project credentials to <code className="rounded bg-surface-muted px-1 py-0.5 text-xs">.env</code> and restart the dev server:
        </p>
        <pre className="mt-4 overflow-x-auto rounded-xl bg-brand-charcoal p-4 text-left text-xs leading-relaxed text-slate-200">
{`VITE_SUPABASE_URL=https://<ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-public-key>`}
        </pre>
        <p className="mt-4 text-xs text-slate-400">
          Find both under Supabase Dashboard → Project Settings → API. The anon key is safe for the browser; never add the service-role key here.
        </p>
      </div>
    </div>
  )
}
