// Server-side Supabase client. Use this in API routes, Server Components, and middleware.
// Never use this in Client Components ("use client"), use client.ts for those.
// 
// Unlike the browser client, this one needs to be told how to read and write cookies
// manually, because there's no browser to handle that automatically.

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
    
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        // Supabase reads cookies to verify the user's session on each request.
        getAll() {
          return cookieStore.getAll()
        },
        // Supabase writes cookies to keep the session token fresh.
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {
            // This fails silently when called from a Server Component, which is fine.
            // The middleware (proxy.ts) handles token refresh for those cases.
          }
        },
      },
    }
  )
}