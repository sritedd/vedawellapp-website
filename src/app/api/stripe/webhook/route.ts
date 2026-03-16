import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createServerClient } from "@supabase/ssr";

function getStripe() {
    return new Stripe(process.env.STRIPE_SECRET_KEY!);
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
    const { data } = await supabase
        .from("profiles")
        .select("id, email, subscription_tier")
        .eq("stripe_customer_id", customerId)
        .single();
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

    switch (event.type) {
        // ─── Payment completed: activate subscription ───────────────
        case "checkout.session.completed": {
            const session = event.data.object as Stripe.Checkout.Session;
            const userId = session.metadata?.supabase_user_id;

            if (userId) {
                await supabase
                    .from("profiles")
                    .update({
                        subscription_tier: "guardian_pro",
                        stripe_customer_id: session.customer as string,
                        subscription_updated_at: new Date().toISOString(),
                    })
                    .eq("id", userId);

                console.log(`[Stripe] checkout.session.completed: user=${userId} → guardian_pro`);
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
