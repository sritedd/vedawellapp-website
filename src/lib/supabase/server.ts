import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { MockSupabaseClient } from './mock'

export async function createClient() {
    const cookieStore = await cookies()

    // SECURITY: Dev mode only works in development environment
    const isDev = process.env.NODE_ENV === 'development';
    const hasDevCookie = cookieStore.get('dev_mode')?.value === 'true';

    if (isDev && hasDevCookie) {
        console.warn('[Security] Using MockSupabaseClient - dev mode only');
        return new MockSupabaseClient() as any;
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
                    }
                },
            },
        }
    )
}

