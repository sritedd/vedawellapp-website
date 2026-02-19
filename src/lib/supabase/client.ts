import { createBrowserClient } from '@supabase/ssr'
import { MockSupabaseClient } from './mock'

export function createClient() {
    // SECURITY: Dev mode only works in development environment
    const isDev = process.env.NODE_ENV === 'development';
    const hasDevCookie = typeof document !== 'undefined' && document.cookie.includes('dev_mode=true');

    if (isDev && hasDevCookie) {
        console.warn('[Security] Using MockSupabaseClient - dev mode only');
        return new MockSupabaseClient() as any;
    }

    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_DATABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
}

