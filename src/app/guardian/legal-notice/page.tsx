import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
    title: "Legal notice — HomeOwner Guardian",
    description:
        "What Guardian's state-specific information is, what it is not, and how to check it against your contract and your state regulator.",
    robots: { index: false },
};

/**
 * The full text behind every LegalNotice link. Plain language on purpose: the
 * reader is a homeowner mid-build, not a lawyer.
 */
export default function LegalNoticePage() {
    return (
        <div className="max-w-2xl mx-auto px-6 py-12 space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Legal notice</h1>
                <p className="mt-2 text-muted-foreground">Last reviewed 9 September 2026</p>
            </div>

            <section className="space-y-3">
                <h2 className="text-xl font-semibold">What Guardian gives you</h2>
                <p>
                    Guardian organises your build around the questions that cost money: what a progress claim should
                    contain, what certificates and inspections should exist before you pay it, and how to keep a record
                    that shows what happened. To do that it uses general information about each Australian state and
                    territory — payment stages, insurance schemes, cooling-off periods, warranty periods, regulator
                    contacts and links.
                </p>
            </section>

            <section className="space-y-3">
                <h2 className="text-xl font-semibold">What it is not</h2>
                <ul className="list-disc pl-5 space-y-2">
                    <li>
                        <strong>It is not legal advice.</strong> Nothing in Guardian is advice about your particular
                        contract, dispute or claim. If money is at stake, get advice from a lawyer or your state's
                        building regulator.
                    </li>
                    <li>
                        <strong>It does not replace an independent inspection.</strong> Keep engaging an independent
                        building inspector at the key stages. Guardian is the record that makes their reports, and
                        your payments, count.
                    </li>
                    <li>
                        <strong>Your contract comes first.</strong> Standard contracts (HIA, Master Builders and others)
                        set the payment stages, the notice periods and your access to the site. Where Guardian's
                        general information and your contract differ, your contract applies.
                    </li>
                </ul>
            </section>

            <section className="space-y-3">
                <h2 className="text-xl font-semibold">How we keep the information current</h2>
                <p>
                    Government websites and rules change. Each state rule Guardian shows carries a "verified" date and,
                    where we can, a link to the official source we checked. We review every state's figures on a
                    schedule, and we would rather show you the date than pretend the rule cannot move. If you find a
                    figure or a link that is out of date, tell us at{" "}
                    <a href="mailto:support@vedawellapp.com" className="underline">support@vedawellapp.com</a> and we
                    will check it.
                </p>
            </section>

            <section className="space-y-3">
                <h2 className="text-xl font-semibold">Your records are yours</h2>
                <p>
                    Photos, documents and notes you add stay private to your account and the people you choose to share
                    them with. Exports are generated from your own records and are intended as supporting evidence;
                    always keep the originals.
                </p>
            </section>

            <p className="text-sm text-muted-foreground">
                See also the site{" "}
                <Link href="/privacy" className="underline">privacy policy</Link>.
            </p>
        </div>
    );
}
