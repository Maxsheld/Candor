// Browser-side Supabase client. Use this in Client Components ("use client").
// Never use this in API routes or Server Components . Use server.ts for those.

import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
    // The ! tells TypeScript these env vars are guaranteed to exist.
    // If they're missing, the app will crash early rather than silently misbehave.
  )
}