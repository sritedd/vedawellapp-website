"use client";

import { useState } from "react";
import australianData from "@/data/australian-build-workflows.json";
import LegalNotice from "@/components/guardian/LegalNotice";
import VerifiedAt from "@/components/guardian/VerifiedAt";

/**
 * What an owner can and cannot do on their own building site, in plain words,
 * with a ready-to-send visit request (guide/19 §1.6, B-21).
 *
 * Why this exists: under the standard residential building contracts used in
 * Australia the builder has possession of the site during the works. Owners can
 * inspect at reasonable times with reasonable notice, subject to site safety,
 * and must not direct the trades. The blog said this; the product assumed
 * continuous access. Reframing "tracking" around the moments an owner is
 * actually allowed — inspection points, claims, documents — is the point.
 *
 * Deliberately general: the exact clause numbers and notice periods are in the
 * owner's own contract, and the panel says so rather than guessing.
 */

const CONTENT_VERIFIED = "2026-09-09";

const PRINCIPLES: Array<{ title: string; body: string }> = [
    {
        title: "The builder holds the site while the work is on",
        body: "Standard contracts (HIA, Master Builders and the state forms) give the builder possession of the site until practical completion. That is why you cannot simply turn up: the builder is responsible for everyone on it.",
    },
    {
        title: "You can inspect — at reasonable times, with reasonable notice",
        body: "The same contracts let you, or someone you appoint, look at the work. Ask in writing, a day or two ahead, and go at a time the site supervisor names. Your contract may set the exact notice; use it.",
    },
    {
        title: "Site safety rules apply to you too",
        body: "Expect to wear closed shoes, hi-vis and a hard hat, to sign in, and to be walked around by the supervisor. Refusing you for a genuine safety reason is normal; refusing you altogether, repeatedly, is not.",
    },
    {
        title: "Look, ask, record — do not direct",
        body: "You can point out concerns and ask questions. Instructions to trades go through the builder, in writing. Giving directions on site can shift responsibility for the result onto you.",
    },
    {
        title: "Independent inspections at the key stages are normal",
        body: "Slab, frame, pre-plaster, waterproofing and practical completion are the usual points. Tell the builder in advance who is coming and when; a builder who books the next trade before an inspection has happened is the pattern to write down.",
    },
    {
        title: "Everything you are entitled to is on paper",
        body: "Progress claims, certificates, inspection reports, variations, written messages and the handover defect list are yours to demand and keep. They are worth more at a dispute than any site visit.",
    },
];

function visitRequestTemplate(builderName: string, projectAddress: string): string {
    return [
        `Subject: Site visit request — ${projectAddress || "[site address]"}`,
        ``,
        `Hi ${builderName || "[builder]"},`,
        ``,
        `I would like to visit the site to look at progress. Could you let me know a suitable time in the next few days? I am flexible on the day and happy to be walked around by the site supervisor, and I will bring the required PPE.`,
        ``,
        `I would also like to take photos for my records. If a stage is about to be covered up (slab, frame, waterproofing, pre-plaster), please let me know before that happens so I can arrange an independent inspection in time.`,
        ``,
        `Thanks,`,
        `[your name]`,
        `[phone]`,
    ].join("\n");
}

export default function RightsOnSite({
    stateCode,
    builderName,
    projectAddress,
}: {
    stateCode: string;
    builderName?: string | null;
    projectAddress?: string | null;
}) {
    const [copied, setCopied] = useState(false);
    const stateInfo = (australianData as unknown as {
        states: Array<{ code: string; name: string; regulator?: string; regulatorUrl?: string }>;
    }).states.find((s) => s.code === stateCode);
    const template = visitRequestTemplate(builderName || "", projectAddress || "");

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(template);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Clipboard unavailable (older browser / permissions) — the text is
            // selectable below, so nothing is lost.
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-bold">Your rights on site</h2>
                <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
                    What you can expect during the build, and what the builder can expect from you. Your own contract
                    sets the details — read its access and inspection clauses alongside this.
                </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
                {PRINCIPLES.map((p) => (
                    <div key={p.title} className="rounded-xl border border-border bg-card p-4">
                        <h3 className="font-semibold text-sm">{p.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{p.body}</p>
                    </div>
                ))}
            </div>

            {stateInfo?.regulatorUrl && (
                <p className="text-sm">
                    Regulator for {stateInfo.name}:{" "}
                    <a href={stateInfo.regulatorUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                        {stateInfo.regulator || stateInfo.regulatorUrl}
                    </a>
                    {" "}
                    <VerifiedAt lastVerified={CONTENT_VERIFIED} source={stateInfo.regulatorUrl} />
                </p>
            )}

            <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                    <h3 className="font-semibold text-sm">Request a site visit — ready to send</h3>
                    <button
                        type="button"
                        onClick={copy}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border bg-background hover:bg-primary/5"
                    >
                        {copied ? "Copied" : "Copy text"}
                    </button>
                </div>
                <pre className="whitespace-pre-wrap text-sm font-sans text-foreground/90 select-all">{template}</pre>
                <p className="text-xs text-muted-foreground">
                    Send it from your own email so it lands in your Messages record. Two refusals in a row, in writing, is
                    worth noting in Watch-outs.
                </p>
            </div>

            <LegalNotice />
        </div>
    );
}
