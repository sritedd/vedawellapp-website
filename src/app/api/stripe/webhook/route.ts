import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createServerClient } from "@supabase/ssr";
import crypto from "crypto";

function getStripe() {
    return new Stripe(process.env.STRIPE_SECRET_KEY!);
}

/**
 * Fire a GA4 Measurement Protocol event for server-side conversion tracking.
 * Requires NEXT_PUBLIC_GA_MEASUREMENT_ID and GA_API_SECRET env vars.
 */
async function trackGA4Purchase(userId: string, amountCents: number, currency: string = "AUD") {
    const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
    const apiSecret = process.env.GA_API_SECRET;
    if (!measurementId || !apiSecret) return;

    try {
        await fetch(
            `https://www.google-analytics.com/mp/collect?measurement_id=${measurementId}&api_secret=${apiSecret}`,
            {
                method: "POST",
                body: JSON.stringify({
                    // GA4 expects a client_id format like "GA1.1.xxx" — use a stable hash of userId
                    client_id: crypto.createHash("sha256").update(userId).digest("hex").slice(0, 20),
                    events: [{
                        name: "purchase",
                        params: {
                            currency,
                            value: amountCents / 100,
                            transaction_id: `stripe_${Date.now()}`,
                            items: [{ item_name: "Guardian Pro", price: amountCents / 100 }],
                        },
                    }],
                }),
            }
        );
    } catch (e) {
        console.warn("[GA4] Failed to track purchase:", e instanceof Error ? e.message : e);
    }
}

function getServiceSupabase() {
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { cookies: { getAll: () => [], setAll: () => { } } }
    );
}

/** Find a profile by stripe_customer_id */
async function findProfileByCustomer(supabase: ReturnType<typeof getServiceSupabase>, customerId: string) {
    const { data, error } = await supabase
        .from("profiles")
        .select("id, email, subscription_tier")
        .eq("stripe_customer_id", customerId)
        .single();
    if (error) {
        console.warn(`[Stripe] Profile lookup failed for customer=${customerId}:`, error.message);
        return null;
    }
    return data;
}

export async function POST(req: NextRequest) {
    const stripe = getStripe();
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
        return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (error) {
        console.error("Webhook signature verification failed:", error);
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // Idempotency: skip already-processed events (Stripe retries on timeouts)
    const { data: existing } = await supabase
        .from("stripe_webhook_events")
        .select("event_id")
        .eq("event_id", event.id)
        .single();

    if (existing) {
        console.log(`[Stripe] Skipping duplicate event: ${event.id} (${event.type})`);
        return NextResponse.json({ received: true, duplicate: true });
    }

    // Record event before processing (fail-safe: even if processing crashes, we don't re-process)
    const { error: idempotencyErr } = await supabase.from("stripe_webhook_events").insert({
        event_id: event.id,
        event_type: event.type,
    });
    if (idempotencyErr) {
        // If insert fails (e.g. unique constraint race), treat as duplicate
        console.warn(`[Stripe] Idempotency insert failed for ${event.id}:`, idempotencyErr.message);
        return NextResponse.json({ received: true, duplicate: true });
    }

    // Guardian Pro price IDs — only these prices grant guardian_pro tier
    const GUARDIAN_PRO_PRICE_IDS = new Set(
        [process.env.STRIPE_MONTHLY_PRICE_ID, process.env.STRIPE_YEARLY_PRICE_ID].filter(Boolean)
    );

    switch (event.type) {
        // ─── Payment completed: activate subscription ───────────────
        case "checkout.session.completed": {
            const session = event.data.object as Stripe.Checkout.Session;
            const userId = session.metadata?.supabase_user_id;

            if (userId) {
                // Verify the user actually exists before granting entitlements
                const { data: existingProfile } = await supabase
                    .from("profiles")
                    .select("id, email")
                    .eq("id", userId)
                    .single();

                if (!existingProfile) {
                    console.error(`[Stripe] checkout.session.completed: metadata user_id=${userId} does not exist — skipping`);
                    break;
                }

                // Cross-check: session customer_email should match profile email
                if (session.customer_email && existingProfile.email &&
                    session.customer_email.toLowerCase() !== existingProfile.email.toLowerCase()) {
                    console.error(`[Stripe] checkout.session.completed: email mismatch — session=${session.customer_email}, profile=${existingProfile.email}, user_id=${userId}`);
                    break;
                }

                // Verify the purchased price is actually a Guardian Pro price
                // Retrieve the line items from the session to check the price ID
                const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 5 });
                const purchasedPriceIds = lineItems.data.map((li) => li.price?.id).filter(Boolean);
                const isGuardianPro = purchasedPriceIds.some((pid) => pid && GUARDIAN_PRO_PRICE_IDS.has(pid));

                if (!isGuardianPro) {
                    console.error(`[Stripe] checkout.session.completed: purchased price(s) [${purchasedPriceIds.join(",")}] not in GUARDIAN_PRO_PRICE_IDS — skipping tier upgrade for user=${userId}`);
                    // Still save stripe_customer_id for future lookups
                    await supabase
                        .from("profiles")
                        .update({ stripe_customer_id: session.customer as string })
                        .eq("id", userId);
                    break;
                }

                await supabase
                    .from("profiles")
                    .update({
                        subscription_tier: "guardian_pro",
                        stripe_customer_id: session.customer as string,
                        subscription_updated_at: new Date().toISOString(),
                    })
                    .eq("id", userId);

                console.log(`[Stripe] checkout.session.completed: user=${userId} → guardian_pro`);

                // Track conversion in GA4
                const amount = session.amount_total || 990;
                await trackGA4Purchase(userId, amount, session.currency?.toUpperCase() || "AUD");
            }
            break;
        }

        // ─── Subscription status changes: activate or deactivate ────
        case "customer.subscription.updated":
        case "customer.subscription.deleted": {
            const subscription = event.data.object as Stripe.Subscription;
            const customerId = subscription.customer as string;
            const profile = await findProfileByCustomer(supabase, customerId);

            if (profile) {
                // Active states: 'active', 'trialing'
                // Inactive states: 'canceled', 'incomplete', 'incomplete_expired',
                //                  'past_due', 'unpaid', 'paused'
                const isActive = subscription.status === "active" || subscription.status === "trialing";
                const newTier = isActive ? "guardian_pro" : "free";

                await supabase
                    .from("profiles")
                    .update({
                        subscription_tier: newTier,
                        subscription_updated_at: new Date().toISOString(),
                    })
                    .eq("id", profile.id);

                console.log(`[Stripe] ${event.type}: customer=${customerId}, status=${subscription.status} → ${newTier}`);
            } else {
                console.warn(`[Stripe] ${event.type}: no profile found for customer=${customerId}`);
            }
            break;
        }

        // ─── Invoice payment failed: downgrade immediately ──────────
        // This fires when a renewal charge fails (card declined, expired, etc.)
        // Stripe retries 3 times over ~3 weeks, but we downgrade immediately
        // to prevent free-riding. If they fix payment, subscription.updated
        // will fire with status='active' and re-upgrade them.
        case "invoice.payment_failed": {
            const invoice = event.data.object as Stripe.Invoice;
            const customerId = invoice.customer as string;

            // Only downgrade on subscription invoices, not one-off charges
            if ((invoice as any).subscription) {
                const profile = await findProfileByCustomer(supabase, customerId);

                if (profile && profile.subscription_tier === "guardian_pro") {
                    await supabase
                        .from("profiles")
                        .update({
                            subscription_tier: "free",
                            subscription_updated_at: new Date().toISOString(),
                        })
                        .eq("id", profile.id);

                    console.log(`[Stripe] invoice.payment_failed: customer=${customerId} → downgraded to free`);
                }
            }
            break;
        }

        // ─── Invoice paid: re-upgrade (handles retry success) ───────
        // If a failed payment is retried and succeeds, re-activate pro.
        case "invoice.paid": {
            const invoice = event.data.object as Stripe.Invoice;
            const customerId = invoice.customer as string;

            if ((invoice as any).subscription) {
                const profile = await findProfileByCustomer(supabase, customerId);

                if (profile && profile.subscription_tier !== "guardian_pro") {
                    await supabase
                        .from("profiles")
                        .update({
                            subscription_tier: "guardian_pro",
                            subscription_updated_at: new Date().toISOString(),
                        })
                        .eq("id", profile.id);

                    console.log(`[Stripe] invoice.paid: customer=${customerId} → re-upgraded to guardian_pro`);
                }
            }
            break;
        }
    }

    return NextResponse.json({ received: true });
}
