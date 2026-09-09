import Link from "next/link";

/**
 * The one disclaimer, wherever a state-specific rule, threshold or verdict is
 * shown (Stage Gate, Should I Pay, Claim Review, Rights on site, the public
 * claim checker, exports). One component so the wording cannot drift between
 * surfaces and so a future legal review has a single place to edit.
 *
 * `compact` renders a single line for dense surfaces; the default renders the
 * short paragraph. Both link to /guardian/legal-notice for the full text.
 */
export default function LegalNotice({ compact = false, className = "" }: { compact?: boolean; className?: string }) {
    if (compact) {
        return (
            <p className={`text-xs text-muted-foreground ${className}`}>
                General information for Australian homeowners, not legal advice.{" "}
                <Link href="/guardian/legal-notice" className="underline hover:text-foreground">
                    Read the full notice
                </Link>
                .
            </p>
        );
    }
    return (
        <div className={`rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground ${className}`}>
            <p>
                Guardian shows general information for Australian homeowners, drawn from state rules we check on a
                schedule. It is not legal advice and it does not replace an independent building inspection. Your
                contract and your state regulator decide what applies to your build.{" "}
                <Link href="/guardian/legal-notice" className="underline hover:text-foreground">
                    Read the full notice
                </Link>
                .
            </p>
        </div>
    );
}
