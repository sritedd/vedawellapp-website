import { createServerClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { MockSupabaseClient } from './mock'

export async function createClient(): Promise<SupabaseClient> {
    const cookieStore = await cookies()

    // SECURITY: Dev mode only works in development environment
    const isDev = process.env.NODE_ENV === 'development';
    const hasDevCookie = cookieStore.get('dev_mode')?.value === 'true';

    if (isDev && hasDevCookie) {
        console.warn('[Security] Using MockSupabaseClient - dev mode only');
        // Cast bounded to the dev-only branch; production path returns the real client.
        return new MockSupabaseClient() as unknown as SupabaseClient;
    }

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // Expected in Server Components where headers are read-only
                    }
                },
            },
        }
    )
}

