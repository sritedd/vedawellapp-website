import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// This route handles the auth callback from Supabase
// e.g. email confirmation links, password reset links
export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/guardian/dashboard'

    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
            return NextResponse.redirect(`${origin}${next}`)
        }
    }

    // If there's a type=recovery in the hash, redirect to reset password page
    const type = searchParams.get('type')
    if (type === 'recovery') {
        return NextResponse.redirect(`${origin}/guardian/reset-password`)
    }

    // Fallback: redirect to login
    return NextResponse.redirect(`${origin}/guardian/login`)
}
