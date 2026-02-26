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

        if (!priceId) {
            return NextResponse.json({ error: "Price ID is required" }, { status: 400 });
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
