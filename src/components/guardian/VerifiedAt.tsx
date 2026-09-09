/**
 * "Verified Sep 2026 · source" — shown beside any state rule, threshold or
 * register link so the reader (and the maintainer) can see when it was last
 * checked and against what. A rule without a date says so, rather than
 * pretending; government rules move (guide/19 §4.2).
 */
export default function VerifiedAt({
    lastVerified,
    source,
    className = "",
}: {
    lastVerified?: string;
    source?: string;
    className?: string;
}) {
    if (!lastVerified) {
        return (
            <span className={`text-[11px] text-muted-foreground ${className}`}>
                Not yet verified — check with your state regulator
            </span>
        );
    }
    const when = new Date(lastVerified).toLocaleDateString("en-AU", { month: "short", year: "numeric" });
    return (
        <span className={`text-[11px] text-muted-foreground ${className}`}>
            Verified {when}
            {source && (
                <>
                    {" · "}
                    <a href={source} target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
                        source
                    </a>
                </>
            )}
        </span>
    );
}
