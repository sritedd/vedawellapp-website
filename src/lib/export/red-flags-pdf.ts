import { PDFDocument, rgb, StandardFonts, PDFFont, PDFPage } from "pdf-lib";

/**
 * Red Flags lead-magnet PDF.
 *
 * Serves as the gated download users receive after signing up at /red-flags.
 * Self-contained — no DB lookups, no per-user data. One function returns bytes.
 */

const TEAL = rgb(13 / 255, 110 / 255, 110 / 255);
const TEAL_DARK = rgb(9 / 255, 85 / 255, 85 / 255);
const BLACK = rgb(0, 0, 0);
const GRAY = rgb(0.38, 0.42, 0.48);
const RED = rgb(0.86, 0.15, 0.15);
const AMBER = rgb(0.85, 0.55, 0.0);
const LIGHT_BG = rgb(0.97, 0.98, 0.99);

const PAGE_W = 595;
const PAGE_H = 842;
const MARGIN = 48;
const LINE_H = 14;

interface RedFlag {
    stage: string;
    title: string;
    what: string;
    why: string;
    action: string;
}

// 30 red flags organised by build stage — most common dodgy-builder patterns
// seen in Australian builds. Each maps to a concrete "what to do now" action.
const RED_FLAGS: RedFlag[] = [
    // ── Pre-construction ─────────────────────────────────────────────────
    { stage: "Pre-construction", title: "Builder pressures you to sign same-day", what: "The contract lands and the sales rep insists you sign before \"the price jumps\".", why: "You have a cooling-off period for a reason. Pressure tactics hide terms you'd renegotiate.", action: "Never sign without a 48-hour review. Get an independent building lawyer to check clauses." },
    { stage: "Pre-construction", title: "No HBCF / home warranty insurance certificate", what: "Builder hasn't produced the mandatory home warranty certificate before accepting deposit.", why: "NSW, VIC, WA, SA, TAS require it for contracts over threshold. Without it you have no recourse if the builder goes insolvent.", action: "Demand the certificate in writing BEFORE paying any deposit. Check iCare / VBA portal to verify it's real." },
    { stage: "Pre-construction", title: "Cash / off-book discount offered", what: "\"Pay 10% in cash and we'll knock off $5k.\"", why: "Unreceipted payments aren't covered by your HBCF policy. If the builder disappears, you lose that money entirely.", action: "Every payment must be invoiced, receipted, and paid by bank transfer. No exceptions." },
    { stage: "Pre-construction", title: "Contract references plans you haven't approved", what: "Final construction drawings attached to the contract differ from what you signed off during design.", why: "The contract governs the build. If plans differ, the builder is legally obligated to build the attached version — not the one you wanted.", action: "Compare every page of final construction drawings against your approved design plans. Refuse to sign if they differ." },
    { stage: "Pre-construction", title: "Provisional sums for 30%+ of the contract", what: "Large chunks of work (kitchen, tiles, driveway) priced as \"provisional\" or \"PC allowance\".", why: "These figures almost always blow out. Builders use them to show a low headline price knowing you'll overspend later.", action: "Demand fixed prices on everything above $3k. If a supplier can't quote, the builder is rushing to contract." },

    // ── Site start / slab ────────────────────────────────────────────────
    { stage: "Site start / slab", title: "Soil test results contradict the quote", what: "Quote assumed Class M soil; actual soil report returns Class H or P (reactive).", why: "Reactive sites need deeper footings. Builder may try to absorb cost by using thinner concrete or less steel.", action: "Get the soil report yourself. Confirm the engineering specs in writing match the tested classification BEFORE pour." },
    { stage: "Site start / slab", title: "Concrete poured before footing inspection", what: "You drive past the site and slab is done — but no inspection was booked.", why: "Footing inspection is your one chance to verify reinforcement steel placement. Once concrete covers it, you'll never know if it was right.", action: "Log a formal defect notice immediately. Demand photos of reinforcement before pour from the builder. Stop payment on base stage." },
    { stage: "Site start / slab", title: "Plumbing rough-in skipped under slab", what: "No plumbing tradie on site, yet builder insists slab is ready to pour.", why: "Plumbing rough-in must be in place and pressure-tested BEFORE pour. Retrofitting through a slab is a $20k+ disaster.", action: "Verify with photographs that drain lines, stormwater, and under-slab services are installed. Get the plumber's compliance certificate." },

    // ── Frame ────────────────────────────────────────────────────────────
    { stage: "Frame", title: "Twisted or split timber in frame", what: "Visible bows, splits, or warping in wall studs / roof trusses.", why: "Once cladding goes on, these faults are hidden but will cause cracked plasterboard, sticking doors, and roof sag for years.", action: "Photograph every defective piece. Refuse frame-stage sign-off until replaced. Get an independent frame inspection ($400-600)." },
    { stage: "Frame", title: "Window / door openings don't match plans", what: "Rough openings are 100mm+ off position or the wrong size.", why: "Builder may be planning to \"make it work\" with undersized windows or ask you to accept the change.", action: "Measure every opening against the plan during frame stage. Flag discrepancies in writing within 48 hours." },
    { stage: "Frame", title: "Insulation missing or substituted", what: "R4.0 batts specified; builder installs R2.5 or none at all in places.", why: "Hidden under plasterboard — you'll discover it when your power bills are 40% higher than quoted.", action: "Photograph every wall and ceiling cavity with a ruler for scale before gyprock. Confirm batch numbers match order records." },

    // ── Lockup ───────────────────────────────────────────────────────────
    { stage: "Lockup", title: "EICC (electrical compliance) not provided before payment", what: "Builder requests lockup stage payment but won't produce the electrical compliance certificate.", why: "You can be held liable for unsafe electrical work if you pay without the cert. Your insurance can refuse future claims.", action: "No EICC = no payment. Write it in your contract. Verify electrical license on state regulator's public register." },
    { stage: "Lockup", title: "Waterproofing membrane not shown pre-tile", what: "Tiles go on wet-area floors without a visible membrane layer.", why: "Tiling over unwaterproofed substrate = water into joists within 2 years. Builder saves $800, you face $30k rectification.", action: "Photograph the membrane application. Demand a waterproofing compliance certificate signed by the tradesperson BEFORE tiles." },
    { stage: "Lockup", title: "Termite barrier missing or damaged", what: "You can't see an installed termite shield or chemical barrier at base of wall plates.", why: "In termite zones (most of Australia) this is code. Without it, your warranty is void and your home is unprotected.", action: "Demand the Part 1 and Part 2 termite certificates. Photograph the barrier during frame stage before it's covered." },

    // ── Fixing / internal ─────────────────────────────────────────────────
    { stage: "Fixing / internal", title: "Appliance or fixture brand substituted", what: "Contract specified Bosch, Fisher & Paykel etc; site install shows a generic brand.", why: "Builder pockets the difference. You discover it at handover when it's \"too late to change\".", action: "Keep a spreadsheet of every specified brand + model. Inspect installed items against the list BEFORE accepting each stage." },
    { stage: "Fixing / internal", title: "Tile lippage or uneven grout", what: "Tiles don't sit flat against neighbours; grout lines vary in width or colour.", why: "Signals a rushed tiler or a builder accepting sub-standard work to stay on schedule. Sets a precedent for future finishes.", action: "Reject the work in writing under your contract's workmanship clause. Photographs + written rejection within 7 days of noticing." },
    { stage: "Fixing / internal", title: "Cabinet doors misaligned or soft-close missing", what: "Kitchen / vanity cabinet doors don't close flush; soft-close hinges substituted with cheap ones.", why: "Quality of joinery is your best indicator of overall build quality. If this is sloppy, everything hidden will be worse.", action: "Operate every drawer and door at fixing stage. Log any defect in writing — the builder must fix before you accept handover." },
    { stage: "Fixing / internal", title: "Downlights crooked or unevenly spaced", what: "Ceiling downlights form a wonky line instead of a grid.", why: "Cheap but visible. Builder knows most homeowners won't reject over cosmetics — creates a pattern of \"it's good enough\".", action: "Photograph ceiling plan. Require re-drilling and patch-painting before acceptance." },

    // ── Handover ─────────────────────────────────────────────────────────
    { stage: "Handover", title: "Builder rushes you through the final walk-through", what: "Walk-through is scheduled for 30 minutes. Builder discourages note-taking.", why: "This is your ONE chance to list defects. Builders who rush you do so deliberately.", action: "Book 2+ hours. Bring a second person with a camera. Use a pre-handover checklist of 80-100 items. Don't sign off same day." },
    { stage: "Handover", title: "Occupation Certificate not yet issued", what: "Builder pushes for final payment but council / private certifier hasn't issued the OC.", why: "Without OC you can't legally occupy the home. Your insurance won't cover you. Utilities may refuse connection.", action: "Final payment is contingent on OC. Written into most state building contracts as standard. Do NOT release until issued." },
    { stage: "Handover", title: "Defects list gets \"lost\" or \"forgotten\"", what: "You email 47 defects; builder responds with 12.", why: "Classic tactic. Split the list, hope you forget, promise to \"get to it later\".", action: "Keep a dated, numbered master list. Email it with every correspondence. Refer to item numbers explicitly. Log on VedaWell so audit trail is bulletproof." },

    // ── Post-handover / warranty ──────────────────────────────────────────
    { stage: "Post-handover", title: "Builder stops returning calls in warranty period", what: "You report cracks in the cornice at month 6; 3 months of voicemails go unanswered.", why: "Legal warranty period (6-7 years in most states) means builder IS obligated to rectify. Silence = their bet that you won't follow up.", action: "Escalate in writing with deadlines. After 21 days, lodge with state Fair Trading / Consumer Affairs. Don't let them run out the clock." },
    { stage: "Post-handover", title: "\"Normal settlement cracks\" excuse for structural issues", what: "Diagonal crack in gyprock; 8mm gap under skirting; door sticks when opening.", why: "Settlement cracks are hairline and horizontal. Anything diagonal, stepped, or widening is structural.", action: "Get an independent structural engineer's report ($600-1200). This is your ammunition for tribunal or HBCF claim." },
    { stage: "Post-handover", title: "Variations you never signed appearing on final invoice", what: "Final bill includes $12k of \"agreed variations\" you have no written record of.", why: "Under state law, variations are invalid without written consent. Builder knows this — betting you won't push back.", action: "Refuse to pay unsigned variations. Point to your state's Home Building Act. Request the signed variation documents in writing." },

    // ── General / throughout ──────────────────────────────────────────────
    { stage: "Throughout", title: "Builder refuses to provide inspection access", what: "Site manager says \"you can't come on site without a supervisor\" then never schedules one.", why: "You have a contractual right to inspect your own build with reasonable notice. Blocking access = something to hide.", action: "Send written notice of 48 hours before each visit. Keep email evidence. Refusal after 2 attempts = defect dispute." },
    { stage: "Throughout", title: "Invoices don't reference stages or completion", what: "Payment demands are generic \"progress payment $45,000\" without proof the stage is complete.", why: "Legally, you only owe payment when the stage is genuinely complete. Early demands are cash-flow pressure tactics.", action: "Each payment demand must attach: photos of stage completion, required certificates, written statement of completion." },
    { stage: "Throughout", title: "Site rubbish, unsafe access, tripping hazards", what: "Protruding rebar, unlidded holes, cables across paths, no fencing.", why: "You're liable if a neighbour is injured. Also signals a crew cutting corners — if safety slips, so does quality.", action: "Photograph unsafe conditions weekly. Report to WorkSafe / SafeWork if dangerous. Include as supporting evidence in any defect claim." },
    { stage: "Throughout", title: "Builder uses their own \"inspector\" / certifier", what: "Private certifier signs off stages without ever meeting you.", why: "Certifier is paid by builder. Their incentive is to keep the builder happy, not catch your problems.", action: "Engage your own independent building inspector for 3-4 key stages: frame, pre-plaster, final. $1500 total. Cheapest insurance you'll buy." },
    { stage: "Throughout", title: "Schedule of works stops being updated", what: "First month there was a weekly progress email. Now it's been silent for 6 weeks.", why: "Silence = delay. Builder is hoping you don't notice they're behind or diverting crew to another site.", action: "Request a written updated schedule monthly. If 2 weeks pass without response, escalate formally. Time is money under most contracts." },
    { stage: "Throughout", title: "Large gap between payment demand and trades on site", what: "You paid frame stage 3 weeks ago; no trades have been on site for 10 days.", why: "Builder may be using your money to pay debts on other sites. When money runs out, they'll demand your next payment early.", action: "Request weekly progress photos + tradesperson attendance. If no activity for 14+ days, formally notify builder of suspension concerns." },
    { stage: "Throughout", title: "Contract clauses you don't understand", what: "\"Prime cost items\", \"latent conditions\", \"time-bar clauses\", \"extension of time\" — builder waves them off.", why: "These are the exact clauses builders use to charge extras, delay handover, or avoid liability. Ignorance costs you tens of thousands.", action: "Get an independent building lawyer to review the contract before signing. $500-800 — saves you multiples in disputes." },
];

export async function generateRedFlagsPdf(): Promise<Uint8Array> {
    const pdf = await PDFDocument.create();
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
    const fontItalic = await pdf.embedFont(StandardFonts.HelveticaOblique);

    const writer = new Writer(pdf, font, fontBold, fontItalic);
    writer.cover();
    writer.intro();

    let currentStage = "";
    for (let i = 0; i < RED_FLAGS.length; i++) {
        const flag = RED_FLAGS[i];
        if (flag.stage !== currentStage) {
            writer.stageHeading(flag.stage);
            currentStage = flag.stage;
        }
        writer.flag(i + 1, flag);
    }

    writer.closing();
    return await pdf.save();
}

class Writer {
    pdf: PDFDocument;
    page: PDFPage;
    y: number;
    font: PDFFont;
    fontBold: PDFFont;
    fontItalic: PDFFont;

    constructor(pdf: PDFDocument, f: PDFFont, fb: PDFFont, fi: PDFFont) {
        this.pdf = pdf;
        this.font = f;
        this.fontBold = fb;
        this.fontItalic = fi;
        this.page = pdf.addPage([PAGE_W, PAGE_H]);
        this.y = PAGE_H - MARGIN;
    }

    addPage() {
        this.page = this.pdf.addPage([PAGE_W, PAGE_H]);
        this.y = PAGE_H - MARGIN;
    }

    checkSpace(needed: number) {
        if (this.y - needed < MARGIN + 30) this.addPage();
    }

    draw(text: string, x: number, opts: { bold?: boolean; italic?: boolean; size?: number; color?: ReturnType<typeof rgb>; maxWidth?: number } = {}) {
        const f = opts.bold ? this.fontBold : opts.italic ? this.fontItalic : this.font;
        const s = opts.size ?? 10;
        const c = opts.color ?? BLACK;
        const maxW = opts.maxWidth ?? PAGE_W - x - MARGIN;

        // Word-wrap
        const words = text.split(" ");
        let line = "";
        for (const word of words) {
            const test = line ? `${line} ${word}` : word;
            if (f.widthOfTextAtSize(test, s) > maxW && line) {
                this.checkSpace(s + 2);
                this.page.drawText(line, { x, y: this.y, size: s, font: f, color: c });
                this.y -= s + 4;
                line = word;
            } else {
                line = test;
            }
        }
        if (line) {
            this.checkSpace(s + 2);
            this.page.drawText(line, { x, y: this.y, size: s, font: f, color: c });
            this.y -= s + 4;
        }
    }

    gap(h = LINE_H) { this.y -= h; }

    hr(color = rgb(0.85, 0.88, 0.9)) {
        this.page.drawLine({ start: { x: MARGIN, y: this.y }, end: { x: PAGE_W - MARGIN, y: this.y }, thickness: 0.5, color });
    }

    cover() {
        // Teal banner at top
        this.page.drawRectangle({ x: 0, y: PAGE_H - 180, width: PAGE_W, height: 180, color: TEAL });

        this.y = PAGE_H - 90;
        this.page.drawText("HOMEGUARDIAN", { x: MARGIN, y: this.y, size: 12, font: this.fontBold, color: rgb(0.85, 1, 1) });
        this.y -= 32;
        this.page.drawText("30 Red Flags", { x: MARGIN, y: this.y, size: 36, font: this.fontBold, color: rgb(1, 1, 1) });
        this.y -= 36;
        this.page.drawText("Your Builder Is Dodgy", { x: MARGIN, y: this.y, size: 22, font: this.font, color: rgb(0.85, 1, 1) });

        // Body below banner
        this.y = PAGE_H - 230;
        this.draw("A field guide for Australian homeowners currently building a new home.", MARGIN, { size: 12, color: GRAY, italic: true });
        this.gap(20);
        this.draw("Every year thousands of Australian families lose money, months, and sleep to builders who cut corners, substitute materials, or quietly disappear mid-build. The signs are almost always there before the damage is done — but only if you know what to look for.", MARGIN, { size: 11 });
        this.gap(8);
        this.draw("This guide catalogues the 30 most common red flags we see across NSW, VIC, QLD, WA, SA, TAS, ACT and NT builds, organised by build stage. For each flag: what it looks like, why it matters, and exactly what to do next.", MARGIN, { size: 11 });
        this.gap(20);

        // Callout box
        this.page.drawRectangle({ x: MARGIN, y: this.y - 70, width: PAGE_W - 2 * MARGIN, height: 70, color: LIGHT_BG, borderColor: TEAL, borderWidth: 1 });
        const calloutY = this.y;
        this.y -= 16;
        this.draw("Why this matters", MARGIN + 14, { size: 11, bold: true, color: TEAL });
        this.y -= 2;
        this.draw("A single caught red flag can save you $5k–$60k. Catching five can save your home.", MARGIN + 14, { size: 10, color: BLACK });
        this.y = calloutY - 90;

        this.draw("How to use this guide", MARGIN, { size: 13, bold: true, color: TEAL });
        this.gap(4);
        this.draw("Read through once. Keep it on your phone. When something feels off during your build, come back and match what you're seeing to the flag descriptions. Each flag lists the specific action to take — follow it immediately. Delay is the builder's friend.", MARGIN, { size: 10 });

        this.addPage();
    }

    intro() {
        this.draw("The anatomy of a dodgy build", MARGIN, { size: 18, bold: true, color: TEAL });
        this.gap(10);
        this.draw("Most Australian builders are honest professionals doing difficult work under tight margins. The minority who aren't follow a predictable playbook:", MARGIN, { size: 11 });
        this.gap(6);
        this.draw("1. They price low to win the contract, using generous \"provisional sums\" to absorb overruns later.", MARGIN, { size: 10 });
        this.draw("2. They rush through early stages before you notice. Concrete covers reinforcement. Plasterboard hides insulation. Cladding hides frame quality.", MARGIN, { size: 10 });
        this.draw("3. They delay paperwork (certificates, compliance, variations) because paperwork is evidence, and evidence is what you need to dispute them later.", MARGIN, { size: 10 });
        this.draw("4. They wear you down. Every rectification becomes a negotiation. You give up eventually — and that's the point.", MARGIN, { size: 10 });
        this.gap(8);
        this.draw("Every red flag in this guide is a moment in that playbook. Recognise it early and you rewrite the script.", MARGIN, { size: 11, italic: true, color: TEAL_DARK });
        this.gap(20);
    }

    stageHeading(stage: string) {
        this.checkSpace(60);
        this.gap(10);
        this.hr(TEAL);
        this.gap(14);
        this.draw(stage.toUpperCase(), MARGIN, { size: 9, bold: true, color: TEAL_DARK });
        this.gap(10);
    }

    flag(num: number, flag: RedFlag) {
        this.checkSpace(120);

        // Flag number in a circle
        this.draw(`#${num.toString().padStart(2, "0")}   ${flag.title}`, MARGIN, { size: 12, bold: true, color: BLACK });
        this.gap(6);

        this.draw("WHAT IT LOOKS LIKE", MARGIN, { size: 7, bold: true, color: GRAY });
        this.gap(2);
        this.draw(flag.what, MARGIN, { size: 10 });
        this.gap(6);

        this.draw("WHY IT MATTERS", MARGIN, { size: 7, bold: true, color: AMBER });
        this.gap(2);
        this.draw(flag.why, MARGIN, { size: 10 });
        this.gap(6);

        this.draw("DO THIS NOW", MARGIN, { size: 7, bold: true, color: RED });
        this.gap(2);
        this.draw(flag.action, MARGIN, { size: 10 });
        this.gap(14);
    }

    closing() {
        this.addPage();
        this.draw("When a red flag appears", MARGIN, { size: 20, bold: true, color: TEAL });
        this.gap(12);
        this.draw("You now know what to look for. When it happens, the clock is ticking — most dispute remedies in Australia are time-limited. The fastest way to build your legal case is to document everything, immediately, in a system designed to hold up in front of NCAT, Fair Trading, or your state's Building Commission.", MARGIN, { size: 11 });
        this.gap(16);

        this.draw("How HomeGuardian helps", MARGIN, { size: 14, bold: true, color: TEAL });
        this.gap(6);
        const features = [
            "Photo-based defect logging with timestamp + geotag (holds up as evidence)",
            "AI that reads your contract and flags dodgy clauses before you sign",
            "Stage-by-stage checklists covering every red flag in this guide",
            "One-click tribunal export: defects + variations + timeline + photos in a formatted PDF",
            "Progress claim AI that tells you whether to pay, hold, or dispute each invoice",
            "State-specific escalation templates (NCAT, VBA, QBCC, Consumer Affairs — all 8 states covered)",
        ];
        for (const f of features) {
            this.draw(`•  ${f}`, MARGIN + 6, { size: 10 });
            this.gap(2);
        }
        this.gap(14);

        // CTA box
        this.page.drawRectangle({ x: MARGIN, y: this.y - 110, width: PAGE_W - 2 * MARGIN, height: 110, color: TEAL });
        this.y -= 20;
        this.draw("Start a free 7-day Pro trial", MARGIN + 16, { size: 16, bold: true, color: rgb(1, 1, 1) });
        this.gap(4);
        this.draw("No credit card. Full access to AI chat, tribunal exports, defect tracking, and every tool in this guide.", MARGIN + 16, { size: 10, color: rgb(0.85, 1, 1), maxWidth: PAGE_W - 2 * MARGIN - 32 });
        this.gap(4);
        this.draw("vedawellapp.com/guardian/pricing", MARGIN + 16, { size: 12, bold: true, color: rgb(1, 1, 1) });
        this.y -= 30;

        // Footer
        this.gap(20);
        this.hr();
        this.gap(10);
        this.draw("This guide is general educational information, not legal advice. For specific builder disputes, consult a solicitor or your state's Fair Trading / Consumer Affairs body. HomeGuardian by VedaWell — vedawellapp.com", MARGIN, { size: 8, color: GRAY, italic: true });
    }
}
