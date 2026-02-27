import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Uses secret key to bypass RLS — safe because we validate input server-side
function getServiceClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SECRET_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

const SLUG_RE = /^[a-z0-9-]{1,80}$/;

export async function POST(req: NextRequest) {
    try {
        const { toolSlug } = await req.json();

        if (!toolSlug || !SLUG_RE.test(toolSlug)) {
            return NextResponse.json({ error: "Invalid tool slug" }, { status: 400 });
        }

        const supabase = getServiceClient();

        // Upsert: increment use_count, update last_used_at
        await supabase.rpc("increment_tool_usage", { slug: toolSlug }).then(async ({ error }) => {
            if (error) {
                // Fallback: manual upsert if the RPC doesn't exist yet
                await supabase.from("tool_usage").upsert(
                    { tool_slug: toolSlug, use_count: 1, last_used_at: new Date().toISOString() },
                    { onConflict: "tool_slug", ignoreDuplicates: false }
                );
            }
        });

        return NextResponse.json({ ok: true });
    } catch {
        // Never fail the client — this is analytics, not critical path
        return NextResponse.json({ ok: true });
    }
}
