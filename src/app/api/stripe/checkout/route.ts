import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";

function getStripe() {
    return new Stripe(process.env.STRIPE_SECRET_KEY!);
}

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { priceId } = await req.json();

        // Allowlist of valid price IDs — prevents billing bypass via arbitrary priceId
        // Fail-closed: if env vars not set, no price IDs are valid
        const ALLOWED_PRICE_IDS = [
            process.env.STRIPE_MONTHLY_PRICE_ID,
            process.env.STRIPE_YEARLY_PRICE_ID,
        ].filter(Boolean);

        if (ALLOWED_PRICE_IDS.length === 0) {
            console.error("[Stripe] No STRIPE_MONTHLY_PRICE_ID or STRIPE_YEARLY_PRICE_ID configured");
            return NextResponse.json({ error: "Payment not configured" }, { status: 500 });
        }

        if (!priceId || !ALLOWED_PRICE_IDS.includes(priceId)) {
            return NextResponse.json({ error: "Invalid price ID" }, { status: 400 });
        }

        const origin = req.headers.get("origin") || "https://vedawellapp.com";
        const stripe = getStripe();

        // Check if user already has a Stripe customer (prevents duplicate customers on re-subscribe)
        const { data: profile } = await supabase
            .from("profiles")
            .select("stripe_customer_id")
            .eq("id", user.id)
            .single();

        const checkoutParams: Stripe.Checkout.SessionCreateParams = {
            mode: "subscription",
            line_items: [{ price: priceId, quantity: 1 }],
            metadata: {
                supabase_user_id: user.id,
            },
            success_url: `${origin}/guardian/dashboard?payment=success&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}/guardian/pricing?payment=cancelled`,
        };

        // Reuse existing Stripe customer if available, otherwise use email for new customer
        if (profile?.stripe_customer_id) {
            checkoutParams.customer = profile.stripe_customer_id;
        } else {
            checkoutParams.customer_email = user.email;
        }

        const session = await stripe.checkout.sessions.create(checkoutParams);

        return NextResponse.json({ url: session.url });
    } catch (error) {
        console.error("Stripe checkout error:", error);
        return NextResponse.json(
            { error: "Failed to create checkout session" },
            { status: 500 }
        );
    }
}
