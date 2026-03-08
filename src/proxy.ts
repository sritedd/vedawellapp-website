import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    // Dev mode bypass — skip auth checks when dev_mode cookie is set (development only)
    if (process.env.NODE_ENV === 'development') {
        const devMode = request.cookies.get('dev_mode')?.value === 'true';
        if (devMode) return supabaseResponse;
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        // Skip auth check if Supabase is not configured — let public pages load
        return supabaseResponse;
    }

    // Only run Supabase auth check for /guardian/* routes to avoid
    // adding latency to public pages (/, /tools, /games, /blog, etc.)
    const { pathname } = request.nextUrl

    if (!pathname.startsWith('/guardian')) {
        return supabaseResponse
    }

    // Public Guardian pages that don't require auth
    const isGuardianPublic =
        pathname === '/guardian' ||
        pathname === '/guardian/login' ||
        pathname === '/guardian/reset-password' ||
        pathname === '/guardian/resources' ||
        pathname === '/guardian/faq' ||
        pathname === '/guardian/pricing'

    if (isGuardianPublic) {
        return supabaseResponse
    }

    // Protected Guardian route — check auth
    const supabase = createServerClient(
        supabaseUrl,
        supabaseKey,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        const loginUrl = request.nextUrl.clone()
        loginUrl.pathname = '/guardian/login'
        loginUrl.searchParams.set('redirectTo', pathname)
        return NextResponse.redirect(loginUrl)
    }

    return supabaseResponse
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico, sitemap.xml, robots.txt, ads.txt
         * - Public assets
         */
        '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|ads.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
