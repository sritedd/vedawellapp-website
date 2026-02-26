import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function POST(req: NextRequest) {
    try {
        const { email, source } = await req.json();

        if (!email || !email.includes("@")) {
            return NextResponse.json({ error: "Valid email required" }, { status: 400 });
        }

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_DATABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            { cookies: { getAll: () => [], setAll: () => {} } }
        );

        // Upsert to handle duplicate emails gracefully
        const { error } = await supabase
            .from("email_subscribers")
            .upsert(
                { email: email.toLowerCase().trim(), source: source || "unknown" },
                { onConflict: "email" }
            );

        if (error) {
            console.error("Subscribe error:", error);
            return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
