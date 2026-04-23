import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import { MockSupabaseClient } from './mock'

export function createClient(): SupabaseClient {
    // SECURITY: Dev mode only works in development environment
    const isDev = process.env.NODE_ENV === 'development';
    const hasDevCookie = typeof document !== 'undefined' && document.cookie.includes('dev_mode=true');

    if (isDev && hasDevCookie) {
        console.warn('[Security] Using MockSupabaseClient - dev mode only');
        // Mock implements the surface the app uses at runtime. Cast is bounded
        // to the dev-only branch and never reaches production builds.
        return new MockSupabaseClient() as unknown as SupabaseClient;
    }

    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
}

