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
        const { error: rpcError } = await supabase.rpc("increment_tool_usage", { slug: toolSlug });
        if (rpcError) {
            // Fallback: try to increment manually if the RPC doesn't exist yet
            const { data: existing } = await supabase
                .from("tool_usage")
                .select("use_count")
                .eq("tool_slug", toolSlug)
                .maybeSingle();

            if (existing) {
                await supabase
                    .from("tool_usage")
                    .update({ use_count: (existing.use_count || 0) + 1, last_used_at: new Date().toISOString() })
                    .eq("tool_slug", toolSlug);
            } else {
                await supabase
                    .from("tool_usage")
                    .insert({ tool_slug: toolSlug, use_count: 1, last_used_at: new Date().toISOString() });
            }
        }

        return NextResponse.json({ ok: true });
    } catch {
        // Never fail the client — this is analytics, not critical path
        return NextResponse.json({ ok: true });
    }
}
