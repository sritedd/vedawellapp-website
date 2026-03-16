import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin";
import { logout, touchLastSeen } from "@/app/guardian/actions";
import ReferralCard from "@/components/guardian/ReferralCard";

export const metadata = {
    title: "Refer a Friend — HomeOwner Guardian",
    description: "Share Guardian with fellow homeowners. When they sign up, you both benefit.",
};

export default async function ReferPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/guardian/login");
    }

    void touchLastSeen(user.id);

    const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin, referral_code, referral_count")
        .eq("id", user.id)
        .single();

    const isAdmin = profile?.is_admin === true || isAdminEmail(user.email);

    // Generate referral code if user doesn't have one
    let referralCode = profile?.referral_code;
    if (!referralCode) {
        // Generate a unique random referral code
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I/O/0/1 for readability
        const generateCode = () => {
            let code = '';
            for (let i = 0; i < 8; i++) {
                code += chars[Math.floor(Math.random() * chars.length)];
            }
            return code;
        };

        // Ensure uniqueness
        let attempts = 0;
        do {
            referralCode = generateCode();
            const { data: existing } = await supabase
                .from("profiles")
                .select("id")
                .eq("referral_code", referralCode)
                .maybeSingle();
            if (!existing) break;
            attempts++;
        } while (attempts < 5);

        await supabase
            .from("profiles")
            .update({ referral_code: referralCode })
            .eq("id", user.id);
    }

    const referralCount = profile?.referral_count ?? 0;
    const referralUrl = `https://vedawellapp.com/guardian?ref=${referralCode}`;

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
                        <Link href="/guardian/refer" className="font-semibold text-primary">
                            Refer
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

            {/* Content */}
            <div className="bg-background">
                <div className="max-w-xl mx-auto px-6 py-12">
                    <div className="text-center mb-8">
                        <div className="text-5xl mb-3">🎁</div>
                        <h1 className="text-2xl font-bold mb-2">Refer a Friend</h1>
                        <p className="text-muted">
                            Share Guardian with other homeowners. For every friend who signs up,
                            you both get recognized in our community.
                        </p>
                    </div>

                    <ReferralCard url={referralUrl} code={referralCode} count={referralCount} />

                    {/* How it works */}
                    <div className="mt-10 space-y-4">
                        <h2 className="font-bold text-lg">How It Works</h2>
                        <div className="grid gap-3">
                            {[
                                { step: "1", title: "Share your link", desc: "Copy your unique referral link and send it to friends who are building or renovating." },
                                { step: "2", title: "They sign up free", desc: "When they create a Guardian account through your link, it's tracked automatically." },
                                { step: "3", title: "Both benefit", desc: "Help fellow homeowners protect their build. Referral milestones unlock recognition." },
                            ].map((item) => (
                                <div key={item.step} className="flex gap-4 items-start p-4 border border-border rounded-xl">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 text-sm">
                                        {item.step}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-sm">{item.title}</p>
                                        <p className="text-muted text-sm">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Share templates */}
                    <div className="mt-10 space-y-4">
                        <h2 className="font-bold text-lg">Quick Share</h2>
                        <div className="grid gap-3">
                            <a
                                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`I'm using HomeOwner Guardian to track my home build — defects, variations, costs all in one place. Free for Aussie homeowners 🏗️\n\n${referralUrl}`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 p-3 border border-border rounded-xl hover:bg-muted/5 transition-colors"
                            >
                                <span className="text-xl">𝕏</span>
                                <span className="text-sm font-medium">Share on X / Twitter</span>
                            </a>
                            <a
                                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralUrl)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 p-3 border border-border rounded-xl hover:bg-muted/5 transition-colors"
                            >
                                <span className="text-xl">📘</span>
                                <span className="text-sm font-medium">Share on Facebook</span>
                            </a>
                            <a
                                href={`https://wa.me/?text=${encodeURIComponent(`Check out HomeOwner Guardian — free tool for tracking building defects and variations during construction: ${referralUrl}`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 p-3 border border-border rounded-xl hover:bg-muted/5 transition-colors"
                            >
                                <span className="text-xl">💬</span>
                                <span className="text-sm font-medium">Share on WhatsApp</span>
                            </a>
                            <a
                                href={`mailto:?subject=${encodeURIComponent("Free home building tracker")}&body=${encodeURIComponent(`Hey, I've been using HomeOwner Guardian to track defects and variations on my build. It's free for Australian homeowners.\n\nCheck it out: ${referralUrl}`)}`}
                                className="flex items-center gap-3 p-3 border border-border rounded-xl hover:bg-muted/5 transition-colors"
                            >
                                <span className="text-xl">📧</span>
                                <span className="text-sm font-medium">Share via Email</span>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
