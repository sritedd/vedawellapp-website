import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin";
import { logout, touchLastSeen, getMyMessages } from "@/app/guardian/actions";
import SupportChat from "@/components/guardian/SupportChat";

export const metadata = {
    title: "Support — HomeOwner Guardian",
    description: "Contact VedaWell support for help with your Guardian account.",
};

export default async function SupportPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/guardian/login");
    }

    void touchLastSeen(user.id);

    const { data: profile } = await supabase
        .from("profiles")
        .select("subscription_tier, is_admin, trial_ends_at")
        .eq("id", user.id)
        .single();

    const isAdmin = profile?.is_admin === true || isAdminEmail(user.email);
    const rawTier = profile?.subscription_tier || "free";
    const trialActive = rawTier === "trial" && profile?.trial_ends_at && new Date(profile.trial_ends_at) > new Date();
    const hasPro = rawTier === "guardian_pro" || isAdmin || trialActive;

    // Pro-only feature: free users see upgrade prompt
    if (!hasPro) {
        return (
            <>
                {/* Sub-Navigation */}
                <div className="border-b border-border bg-muted/5">
                    <div className="max-w-7xl mx-auto px-6 py-3 flex justify-between items-center">
                        <div className="flex items-center gap-6">
                            <Link href="/guardian/dashboard" className="text-muted hover:text-foreground">Dashboard</Link>
                            <Link href="/guardian/projects" className="text-muted hover:text-foreground">Projects</Link>
                            <Link href="/guardian/support" className="font-semibold text-primary">Support</Link>
                        </div>
                        <Link href="/guardian/profile" className="text-muted text-sm hover:text-primary">{user.email}</Link>
                    </div>
                </div>
                <div className="bg-background">
                    <div className="max-w-lg mx-auto px-4 py-16 text-center">
                        <div className="text-5xl mb-4">🔒</div>
                        <h1 className="text-2xl font-bold mb-2">Priority Support</h1>
                        <p className="text-muted mb-6">
                            Direct messaging with the VedaWell team is available for Guardian Pro subscribers.
                            Upgrade to get priority support for your construction project.
                        </p>
                        <Link
                            href="/guardian/pricing"
                            className="inline-block px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors"
                        >
                            Upgrade to Guardian Pro
                        </Link>
                        <p className="text-xs text-muted mt-4">
                            Need urgent help? Email us at <a href="mailto:support@vedawellapp.com" className="text-primary hover:underline">support@vedawellapp.com</a>
                        </p>
                    </div>
                </div>
            </>
        );
    }

    const { messages } = await getMyMessages();

    return (
        <>
            {/* Sub-Navigation */}
            <div className="border-b border-border bg-muted/5">
                <div className="max-w-7xl mx-auto px-6 py-3 flex justify-between items-center">
                    <div className="flex items-center gap-6">
                        <Link href="/guardian/dashboard" className="text-muted hover:text-foreground">
                            Dashboard
                        </Link>
                        <Link href="/guardian/projects" className="text-muted hover:text-foreground">
                            Projects
                        </Link>
                        <Link href="/guardian/journey" className="text-muted hover:text-foreground">
                            Learn
                        </Link>
                        <Link href="/guardian/support" className="font-semibold text-primary">
                            Support
                        </Link>
                        {isAdmin && (
                            <Link href="/guardian/admin" className="text-yellow-600 hover:text-yellow-500 font-medium text-sm">
                                Admin
                            </Link>
                        )}
                    </div>
                    <div className="flex items-center gap-4">
                        <Link href="/guardian/profile" className="text-muted text-sm hover:text-primary transition-colors">
                            {user.email}
                        </Link>
                        <form action={logout}>
                            <button
                                type="submit"
                                className="text-sm text-muted hover:text-danger transition-colors px-3 py-1 rounded border border-border hover:border-danger"
                            >
                                Sign Out
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            {/* Chat */}
            <div className="bg-background">
                <div className="max-w-2xl mx-auto px-4 py-6">
                    <div className="mb-4">
                        <h1 className="text-xl font-bold">Contact Support</h1>
                        <p className="text-muted text-sm">Ask a question, report an issue, or share feedback. We typically respond within 24 hours.</p>
                    </div>
                    <SupportChat initialMessages={messages} />
                </div>
            </div>
        </>
    );
}
