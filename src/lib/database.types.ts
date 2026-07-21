/**
 * Placeholder Supabase Database type.
 *
 * Regenerate the real types from your live schema with:
 *   npx supabase gen types typescript --project-id <ref> > src/lib/database.types.ts
 *
 * Until then this permissive shape keeps the client typed without blocking builds.
 */
export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: Record<string, { Row: Record<string, Json>; Insert: Record<string, Json>; Update: Record<string, Json> }>
    Views: Record<string, { Row: Record<string, Json> }>
    Functions: Record<string, unknown>
    Enums: Record<string, unknown>
  }
}
