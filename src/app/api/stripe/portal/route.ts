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

        // Get the user's Stripe customer ID from their profile
        const { data: profile } = await supabase
            .from("profiles")
            .select("stripe_customer_id")
            .eq("id", user.id)
            .single();

        if (!profile?.stripe_customer_id) {
            return NextResponse.json({ error: "No active subscription found" }, { status: 404 });
        }

        const origin = req.headers.get("origin") || "https://vedawellapp.com";
        const stripe = getStripe();

        const session = await stripe.billingPortal.sessions.create({
            customer: profile.stripe_customer_id,
            return_url: `${origin}/guardian/dashboard`,
        });

        return NextResponse.json({ url: session.url });
    } catch (error) {
        console.error("Portal session error:", error);
        return NextResponse.json(
            { error: "Failed to create portal session" },
            { status: 500 }
        );
    }
}
