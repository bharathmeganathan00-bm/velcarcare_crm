import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/**
 * True when live Supabase credentials are present in `.env`.
 * When false, the app shows a "configure Supabase" screen instead of crashing.
 */
export const isConfigured = Boolean(
  url && anonKey && !url.includes('your-project-ref') && !anonKey.includes('your-anon'),
)

/**
 * Untyped client on purpose: the app maps rows to domain types in `src/lib/api.ts`,
 * so we skip the generated Database generic (regenerate + add it later if desired).
 */
export const supabase = isConfigured
  ? createClient(url!, anonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : (null as unknown as ReturnType<typeof createClient>)
