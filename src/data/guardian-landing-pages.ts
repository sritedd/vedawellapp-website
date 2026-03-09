/** SEO landing pages targeting high-intent Australian construction keywords */
export interface GuardianLandingPage {
    slug: string;
    title: string;
    description: string;
    h1: string;
    intro: string;
    sections: { heading: string; content: string }[];
    keywords: string[];
    cta: string;
}

export const GUARDIAN_LANDING_PAGES: GuardianLandingPage[] = [
    {
        slug: "nsw-building-defects",
        title: "NSW Building Defect Tracker — Document & Report Defects | Guardian",
        description: "Track building defects in NSW with photo evidence, severity ratings, and Fair Trading-ready reports. Free for homeowners building in New South Wales.",
        h1: "Track Building Defects in NSW",
        intro: "Building a new home in NSW? HomeOwner Guardian helps you document every defect with timestamped photos, severity ratings, and reports formatted for NSW Fair Trading or NCAT proceedings.",
        sections: [
            {
                heading: "Why NSW Homeowners Need Defect Tracking",
                content: "Under the NSW Home Building Act 1989, builders must fix structural defects for up to 6 years and non-structural defects for 2 years. But without proper documentation, proving defects existed during the warranty period becomes nearly impossible. Guardian creates a legally defensible evidence trail from day one."
            },
            {
                heading: "What You Can Track",
                content: "Log cracking, water ingress, uneven surfaces, incomplete work, non-compliant installations, and any deviation from your building contract. Each defect is tagged with severity (critical, major, minor), location, photos, and timestamps that cannot be altered."
            },
            {
                heading: "Fair Trading & NCAT Ready",
                content: "If your builder refuses to fix defects, you can generate a comprehensive defect report suitable for lodging complaints with NSW Fair Trading or taking action through NCAT (NSW Civil and Administrative Tribunal). Our reports include all evidence in chronological order with photo attachments."
            },
            {
                heading: "Works With Your Building Inspector",
                content: "Share your defect log with your private building inspector or certifier. They can verify your documented defects match their independent findings, strengthening your case significantly."
            }
        ],
        keywords: ["nsw building defects", "building defect tracker nsw", "nsw fair trading building complaint", "home building defects new south wales", "ncat building dispute", "nsw home warranty defects"],
        cta: "Start Tracking Defects Free"
    },
    {
        slug: "construction-variation-tracker",
        title: "Construction Variation Tracker — Log Builder Variations & Cost Changes",
        description: "Track every building variation with digital signatures, cost impact, and approval status. Stop builder cost blowouts before they happen.",
        h1: "Track Construction Variations & Stop Cost Blowouts",
        intro: "The average Australian new home build has 15-25 variations adding $30,000-$80,000 to the original contract. Guardian helps you track every variation, understand the cost impact, and maintain a signed approval trail.",
        sections: [
            {
                heading: "Why Variations Cost Homeowners Thousands",
                content: "Builders often present variations verbally or via informal text messages, making it impossible to track the true cost impact. Without a system, homeowners discover at lock-up that they're $50,000 over budget with no clear record of what was agreed."
            },
            {
                heading: "Digital Variation Lockbox",
                content: "Every variation is logged with: description of work, reason for change, cost impact (additions and credits), date proposed, approval status, and optional digital signature. Nothing can be changed after signing — creating an immutable record."
            },
            {
                heading: "Running Cost Impact Dashboard",
                content: "See your total contract value, total approved variations, and projected final cost in real-time. Get alerts when variations push you past key budget thresholds. Know exactly where your money is going at every stage."
            },
            {
                heading: "Protect Yourself at Final Payment",
                content: "When your builder presents the final invoice, you'll have a complete, signed record of every agreed variation. No surprises, no disputes about what was included. This alone can save homeowners tens of thousands of dollars."
            }
        ],
        keywords: ["construction variation tracker", "building variation log", "builder variation costs", "construction cost blowout", "home building variations australia", "variation order tracking"],
        cta: "Start Tracking Variations Free"
    },
    {
        slug: "home-building-checklist-australia",
        title: "Australian Home Building Checklist — Pre-Drywall to Handover | Guardian",
        description: "Complete stage-by-stage construction checklist for Australian homeowners. From slab to handover, never miss a critical inspection point.",
        h1: "Australian Home Building Checklist",
        intro: "Don't rely on your builder to tell you what to check. Our construction checklist covers every stage from site preparation to final handover, based on the National Construction Code and state-specific requirements.",
        sections: [
            {
                heading: "Stage-by-Stage Checklists",
                content: "Foundation & Slab: check steel reinforcement, termite barriers, drainage. Frame: verify timber grades, bracing, tie-downs. Lock-up: inspect windows, doors, roofing, flashings. Pre-Drywall: this is your LAST chance to see inside walls — check plumbing, electrical, insulation. Fixing: cabinets, tiling, paint quality. Handover: the comprehensive final inspection."
            },
            {
                heading: "Pre-Drywall: The Most Critical Inspection",
                content: "Once plasterboard goes up, you'll never see the inside of your walls again. Our pre-drywall checklist ensures you verify insulation R-values, electrical wiring routes, plumbing pressure tests, waterproofing membranes, and structural bracing BEFORE they're hidden forever."
            },
            {
                heading: "Photo Documentation at Each Stage",
                content: "Take photos at every checkpoint and attach them directly to the checklist item. This creates a visual construction diary that's invaluable if issues emerge months or years after handover."
            },
            {
                heading: "Based on Australian Standards",
                content: "Our checklists reference the National Construction Code (NCC), relevant Australian Standards (AS), and state-specific requirements including NSW BASIX, Victorian 6-Star, and Queensland QDC."
            }
        ],
        keywords: ["home building checklist australia", "construction checklist new home", "pre drywall inspection checklist", "building inspection checklist australia", "new home construction stages", "handover checklist australia"],
        cta: "Get Your Free Checklist"
    },
    {
        slug: "hbcf-insurance-guide",
        title: "HBCF Insurance Guide for NSW Homeowners — What You Need to Know",
        description: "Understand Home Building Compensation Fund insurance in NSW. What's covered, when to claim, and how to document evidence for HBCF claims.",
        h1: "HBCF Insurance: Your Safety Net When Builders Fail",
        intro: "The Home Building Compensation Fund (HBCF) protects NSW homeowners when builders die, disappear, or become insolvent. But claims are only successful with proper documentation. Here's what you need to know.",
        sections: [
            {
                heading: "What HBCF Covers",
                content: "HBCF insurance is mandatory for residential building work over $20,000 in NSW. It covers incomplete work and defective work if your builder dies, disappears, becomes insolvent, or has their licence suspended. Coverage is up to $340,000 for loss due to non-completion and defects."
            },
            {
                heading: "When You Need to Claim",
                content: "You must lodge a claim within the warranty period: 6 years for structural defects, 2 years for non-structural defects from completion. The clock starts at the date of completion or the date you first occupy the home, whichever is earlier."
            },
            {
                heading: "Documentation is Everything",
                content: "HBCF claims require evidence of defects, your attempts to contact the builder, and proof that the builder cannot or will not rectify. Guardian automatically creates this evidence trail — timestamped defect photos, builder communications log, and chronological reports."
            },
            {
                heading: "Track Your HBCF Policy in Guardian",
                content: "Store your HBCF policy number, insurer details, and expiry dates in your Guardian project. Set up reminders before warranty periods expire. Generate claim-ready evidence packs with one click."
            }
        ],
        keywords: ["hbcf insurance nsw", "home building compensation fund", "hbcf claim process", "nsw builder insurance", "building warranty insurance nsw", "hbcf coverage limits"],
        cta: "Track Your HBCF Policy Free"
    },
    {
        slug: "builder-dispute-evidence",
        title: "Builder Dispute? Collect Evidence That Wins — HomeOwner Guardian",
        description: "Collecting evidence for a building dispute? Guardian creates timestamped, legally defensible documentation for Fair Trading, NCAT, and VCAT proceedings.",
        h1: "Build an Airtight Case Against Your Builder",
        intro: "80% of building disputes fail due to lack of evidence. Don't be one of them. Guardian helps homeowners systematically document every issue from the first sign of trouble.",
        sections: [
            {
                heading: "The Evidence That Matters",
                content: "Tribunals and regulators need: dated photographs of defects, written records of builder communications, a timeline of events, copies of your building contract and variations, independent expert reports, and financial records of costs incurred. Guardian organises all of this automatically."
            },
            {
                heading: "Timestamped & Tamper-Proof",
                content: "Every photo, note, and document you add to Guardian is timestamped at the time of upload. This creates a contemporaneous record — evidence created at the time events occurred, which carries significantly more weight than evidence compiled after the fact."
            },
            {
                heading: "Generate Tribunal-Ready Reports",
                content: "Export your entire project as a chronological evidence pack: defect register with photos, variation log with cost impact, communication timeline, and certificate/inspection records. Formatted for submission to Fair Trading, NCAT (NSW), VCAT (VIC), QCAT (QLD), or SAT (WA)."
            },
            {
                heading: "Share With Your Lawyer",
                content: "Give your building lawyer instant access to your organised evidence. Instead of spending billable hours sorting through emails and photos, they can focus on building your legal strategy."
            }
        ],
        keywords: ["building dispute evidence", "builder dispute australia", "ncat building evidence", "vcat building dispute", "fair trading building complaint evidence", "building defect evidence collection"],
        cta: "Start Collecting Evidence Free"
    },
    {
        slug: "new-home-construction-costs",
        title: "Track New Home Construction Costs in Real-Time — Guardian",
        description: "Monitor your new home build costs including contract value, variations, and projected total. Avoid budget blowouts with real-time tracking.",
        h1: "Know Exactly What Your New Home Will Cost",
        intro: "The average Australian new build goes 15-25% over budget. With Guardian, you see your running total in real-time — contract value plus every approved variation — so there are no surprises at handover.",
        sections: [
            {
                heading: "The Hidden Costs Builders Don't Tell You About",
                content: "Site costs, soil reports, BAL ratings, retaining walls, landscaping allowances, driveway crossovers, temporary power/water, council fees, and dozens of variations. Most homeowners don't discover the true cost until it's too late to adjust."
            },
            {
                heading: "Real-Time Cost Dashboard",
                content: "See your original contract value, total approved variations (additions and credits), pending variations, and projected final cost. Updated instantly as you approve or reject each variation."
            },
            {
                heading: "Budget Alerts",
                content: "Set your maximum budget and get visual warnings as variations push you toward the limit. Know when to push back on non-essential variations to stay within budget."
            },
            {
                heading: "Compare Against Contract Inclusions",
                content: "Track what was included in your original contract versus what's being charged as extras. Many builders charge for items that should have been included — catch these before signing the variation."
            }
        ],
        keywords: ["new home construction costs australia", "building cost tracker", "construction budget tracker", "new home build budget", "builder cost overrun", "home building cost calculator australia"],
        cta: "Track Your Build Costs Free"
    },
];
