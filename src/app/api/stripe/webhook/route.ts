import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createServerClient } from "@supabase/ssr";

function getStripe() {
    return new Stripe(process.env.STRIPE_SECRET_KEY!);
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

    // Use service role key for admin operations
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_DATABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { cookies: { getAll: () => [], setAll: () => {} } }
    );

    switch (event.type) {
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
            }
            break;
        }

        case "customer.subscription.deleted":
        case "customer.subscription.updated": {
            const subscription = event.data.object as Stripe.Subscription;
            const customerId = subscription.customer as string;

            // Find user by Stripe customer ID
            const { data: profile } = await supabase
                .from("profiles")
                .select("id")
                .eq("stripe_customer_id", customerId)
                .single();

            if (profile) {
                const isActive = subscription.status === "active" || subscription.status === "trialing";
                await supabase
                    .from("profiles")
                    .update({
                        subscription_tier: isActive ? "guardian_pro" : "free",
                        subscription_updated_at: new Date().toISOString(),
                    })
                    .eq("id", profile.id);
            }
            break;
        }
    }

    return NextResponse.json({ received: true });
}
