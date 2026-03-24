import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// This route handles the auth callback from Supabase
// e.g. email confirmation links, password reset links
export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const type = searchParams.get('type')
    const next = searchParams.get('next') ?? '/guardian/dashboard'

    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
            // Recovery flow: redirect to reset-password page instead of dashboard
            if (type === 'recovery') {
                return NextResponse.redirect(`${origin}/guardian/reset-password`)
            }
            return NextResponse.redirect(`${origin}${next}`)
        }
    }

    // Direct recovery link (no PKCE code, token in hash fragment)
    if (type === 'recovery') {
        return NextResponse.redirect(`${origin}/guardian/reset-password`)
    }

    // Fallback: redirect to login
    return NextResponse.redirect(`${origin}/guardian/login`)
}
