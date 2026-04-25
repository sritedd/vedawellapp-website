import type { Metadata } from "next";
import { createServerClient } from "@supabase/ssr";

export const metadata: Metadata = {
    title: "Unsubscribed",
    robots: { index: false, follow: false },
};

function getServiceSupabase() {
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { cookies: { getAll: () => [], setAll: () => { } } }
    );
}

export default async function UnsubscribePage({
    searchParams,
}: {
    searchParams: Promise<{ token?: string }>;
}) {
    const params = await searchParams;
    const token = params.token?.trim();

    let outcome: "ok" | "invalid" | "error" = "invalid";

    if (token && /^[a-f0-9]{16,128}$/.test(token)) {
        try {
            const supabase = getServiceSupabase();
            const { data: existing, error: lookupErr } = await supabase
                .from("email_subscribers")
                .select("email, status")
                .eq("unsubscribe_token", token)
                .maybeSingle();

            if (lookupErr) {
                outcome = "error";
                console.error("[unsubscribe] Lookup failed:", lookupErr.message);
            } else if (!existing) {
                outcome = "invalid";
            } else {
                const { error: updateErr } = await supabase
                    .from("email_subscribers")
                    .update({ status: "unsubscribed" })
                    .eq("unsubscribe_token", token);
                outcome = updateErr ? "error" : "ok";
                if (updateErr) console.error("[unsubscribe] Update failed:", updateErr.message);
            }
        } catch (e) {
            console.error("[unsubscribe] Unexpected:", e);
            outcome = "error";
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-6 bg-background">
            <div className="max-w-md w-full bg-card border border-border rounded-2xl p-8 text-center shadow-sm">
                {outcome === "ok" && (
                    <>
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold mb-2">You&apos;re unsubscribed</h1>
                        <p className="text-muted-foreground">
                            We won&apos;t send you any more marketing emails. Sorry to see you go.
                        </p>
                    </>
                )}
                {outcome === "invalid" && (
                    <>
                        <h1 className="text-2xl font-bold mb-2">Link not recognised</h1>
                        <p className="text-muted-foreground">
                            This unsubscribe link is invalid or has expired. If you&apos;re still receiving emails, reply to one of them and we&apos;ll remove you manually.
                        </p>
                    </>
                )}
                {outcome === "error" && (
                    <>
                        <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
                        <p className="text-muted-foreground">
                            We couldn&apos;t process your unsubscribe right now. Please try again, or reply to a recent email and we&apos;ll handle it manually.
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}
