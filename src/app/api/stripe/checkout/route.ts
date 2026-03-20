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
        const ALLOWED_PRICE_IDS = [
            process.env.STRIPE_MONTHLY_PRICE_ID || "price_1T4zHCGrwDXNt9f4x4O2MxlZ",
            // Add yearly price ID here when created
        ].filter(Boolean);

        if (!priceId || !ALLOWED_PRICE_IDS.includes(priceId)) {
            return NextResponse.json({ error: "Invalid price ID" }, { status: 400 });
        }

        const origin = req.headers.get("origin") || "https://vedawellapp.com";
        const stripe = getStripe();

        const session = await stripe.checkout.sessions.create({
            mode: "subscription",
            line_items: [{ price: priceId, quantity: 1 }],
            customer_email: user.email,
            metadata: {
                supabase_user_id: user.id,
            },
            success_url: `${origin}/guardian/dashboard?payment=success&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}/guardian/pricing?payment=cancelled`,
        });

        return NextResponse.json({ url: session.url });
    } catch (error) {
        console.error("Stripe checkout error:", error);
        return NextResponse.json(
            { error: "Failed to create checkout session" },
            { status: 500 }
        );
    }
}
