"use client";

import { useState, useCallback } from "react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface DisputeResolutionProps {
  projectId: string;
  stateCode?: string;
  builderName?: string;
  projectName?: string;
  projectAddress?: string;
}

type StateCode = "NSW" | "VIC" | "QLD" | "WA" | "SA" | "TAS" | "ACT" | "NT";

interface DisputeStep {
  step: number;
  name: string;
  description: string;
  timeframe: string;
  authority: string;
  url: string;
  cost: string;
}

interface StatePathway {
  label: string;
  timeLimitWarning: string;
  steps: DisputeStep[];
}

interface TemplateDef {
  id: string;
  title: string;
  description: string;
  generate: (ctx: LetterContext) => string;
}

interface LetterContext {
  date: string;
  builderName: string;
  projectAddress: string;
  projectName: string;
}

/* ------------------------------------------------------------------ */
/*  State-specific dispute resolution data                             */
/* ------------------------------------------------------------------ */

const STATE_PATHWAYS: Record<StateCode, StatePathway> = {
  NSW: {
    label: "New South Wales",
    timeLimitWarning:
      "Defect claims must be lodged within 2 years (minor) or 6 years (major/structural) from completion.",
    steps: [
      {
        step: 1,
        name: "Written Notice to Builder",
        description:
          "Send a formal written notice to your builder detailing the defect or dispute. Allow 14 days for a response. Keep a copy of all correspondence.",
        timeframe: "14 days for builder to respond",
        authority: "N/A (direct communication)",
        url: "",
        cost: "Free",
      },
      {
        step: 2,
        name: "NSW Fair Trading Complaint",
        description:
          "If the builder fails to respond or resolve the issue, lodge a formal complaint with NSW Fair Trading. They will attempt to mediate between you and the builder.",
        timeframe: "Typically 4\u201312 weeks for investigation",
        authority: "NSW Fair Trading",
        url: "https://www.fairtrading.nsw.gov.au/housing-and-property/building-and-renovating/resolving-building-disputes",
        cost: "Free",
      },
      {
        step: 3,
        name: "NCAT Application (Tribunal)",
        description:
          "Apply to the NSW Civil and Administrative Tribunal (NCAT) for a binding decision. You may need legal advice at this stage. The tribunal can order rectification or compensation.",
        timeframe: "2\u20136 months from application to hearing",
        authority: "NSW Civil and Administrative Tribunal (NCAT)",
        url: "https://www.ncat.nsw.gov.au/",
        cost: "Filing fee from $53 (consumer claims under $10,000)",
      },
    ],
  },
  VIC: {
    label: "Victoria",
    timeLimitWarning:
      "Defect claims must be lodged within 2 years (minor) or 6 years (structural) from completion under the Domestic Building Contracts Act 1995.",
    steps: [
      {
        step: 1,
        name: "Written Notice to Builder",
        description:
          "Provide your builder with a formal written notice of the defect or dispute. Reference the relevant clauses of your building contract and request rectification within 14 days.",
        timeframe: "14 days for builder to respond",
        authority: "N/A (direct communication)",
        url: "",
        cost: "Free",
      },
      {
        step: 2,
        name: "DBDRV (Mandatory Conciliation)",
        description:
          "In Victoria, you must apply to Domestic Building Dispute Resolution Victoria (DBDRV) before proceeding to VCAT. DBDRV provides free conciliation services and this step is mandatory.",
        timeframe: "Typically 4\u20138 weeks for conciliation",
        authority: "Domestic Building Dispute Resolution Victoria (DBDRV)",
        url: "https://www.dbdrv.vic.gov.au/",
        cost: "Free",
      },
      {
        step: 3,
        name: "VCAT Application",
        description:
          "If DBDRV conciliation is unsuccessful, you can apply to the Victorian Civil and Administrative Tribunal (VCAT) for a binding decision. A DBDRV certificate is required before VCAT will accept your application.",
        timeframe: "3\u20139 months from application to hearing",
        authority: "Victorian Civil and Administrative Tribunal (VCAT)",
        url: "https://www.vcat.vic.gov.au/",
        cost: "Filing fee from $65 (standard application)",
      },
    ],
  },
  QLD: {
    label: "Queensland",
    timeLimitWarning:
      "Defect claims: 6 months (minor) or 6 years 6 months (structural) from practical completion under the QBCC Act.",
    steps: [
      {
        step: 1,
        name: "Written Notice to Builder",
        description:
          "Send a formal written defect notice to your builder. Reference your QBCC-regulated contract and request rectification within 14 days.",
        timeframe: "14 days for builder to respond",
        authority: "N/A (direct communication)",
        url: "",
        cost: "Free",
      },
      {
        step: 2,
        name: "QBCC Early Dispute Resolution",
        description:
          "Lodge a complaint with the Queensland Building and Construction Commission (QBCC). They offer early dispute resolution and can issue directions to the builder for rectification.",
        timeframe: "Typically 4\u201310 weeks",
        authority: "Queensland Building and Construction Commission (QBCC)",
        url: "https://www.qbcc.qld.gov.au/disputes-complaints",
        cost: "Free",
      },
      {
        step: 3,
        name: "QCAT Application",
        description:
          "If QBCC resolution is unsuccessful, apply to the Queensland Civil and Administrative Tribunal (QCAT) for a binding determination.",
        timeframe: "3\u20136 months from application to hearing",
        authority: "Queensland Civil and Administrative Tribunal (QCAT)",
        url: "https://www.qcat.qld.gov.au/",
        cost: "Filing fee from $78 (minor civil dispute)",
      },
    ],
  },
  WA: {
    label: "Western Australia",
    timeLimitWarning:
      "Defect claims must be lodged within 6 years from practical completion under the Home Building Contracts Act 1991.",
    steps: [
      {
        step: 1,
        name: "Written Notice to Builder",
        description:
          "Provide your builder with a formal written notice of defects. Reference the Home Building Contracts Act 1991 and request rectification within 14 days.",
        timeframe: "14 days for builder to respond",
        authority: "N/A (direct communication)",
        url: "",
        cost: "Free",
      },
      {
        step: 2,
        name: "Building Commission Complaint (DMIRS)",
        description:
          "Lodge a complaint with the Building and Energy division of the Department of Mines, Industry Regulation and Safety (DMIRS). They can investigate and order remediation.",
        timeframe: "Typically 6\u201312 weeks for investigation",
        authority:
          "Department of Mines, Industry Regulation and Safety (DMIRS)",
        url: "https://www.commerce.wa.gov.au/building-and-energy",
        cost: "Free",
      },
      {
        step: 3,
        name: "SAT Application",
        description:
          "Apply to the State Administrative Tribunal (SAT) for a binding decision if the complaint through DMIRS does not resolve the matter.",
        timeframe: "3\u20139 months from application to hearing",
        authority: "State Administrative Tribunal (SAT)",
        url: "https://www.sat.justice.wa.gov.au/",
        cost: "Filing fee from $114 (general application)",
      },
    ],
  },
  SA: {
    label: "South Australia",
    timeLimitWarning:
      "Defect claims must be lodged within 5 years from completion under the Building Work Contractors Act 1995.",
    steps: [
      {
        step: 1,
        name: "Written Notice to Builder",
        description:
          "Send a formal written notice to your builder detailing the defects or dispute. Include photos and reference contract clauses. Allow 14 days for a response.",
        timeframe: "14 days for builder to respond",
        authority: "N/A (direct communication)",
        url: "",
        cost: "Free",
      },
      {
        step: 2,
        name: "Consumer and Business Services Complaint",
        description:
          "Lodge a complaint with Consumer and Business Services (CBS). They can investigate and attempt conciliation between you and the builder.",
        timeframe: "Typically 4\u201310 weeks",
        authority: "Consumer and Business Services (CBS)",
        url: "https://www.cbs.sa.gov.au/building-disputes",
        cost: "Free",
      },
      {
        step: 3,
        name: "SACAT Application",
        description:
          "Apply to the South Australian Civil and Administrative Tribunal (SACAT) for a binding determination on the dispute.",
        timeframe: "3\u20136 months from application to hearing",
        authority:
          "South Australian Civil and Administrative Tribunal (SACAT)",
        url: "https://www.sacat.sa.gov.au/",
        cost: "Filing fee from $90 (standard application)",
      },
    ],
  },
  TAS: {
    label: "Tasmania",
    timeLimitWarning:
      "Defect claims must be lodged within 12 months (non-structural) or 6 years (structural) from completion under the Building Act 2016.",
    steps: [
      {
        step: 1,
        name: "Written Notice to Builder",
        description:
          "Send a formal written notice to your builder detailing the defect or dispute. Include photos and reference contract clauses. Allow 14 days for a response.",
        timeframe: "14 days for builder to respond",
        authority: "N/A (direct communication)",
        url: "",
        cost: "Free",
      },
      {
        step: 2,
        name: "CBOS Building Dispute Resolution",
        description:
          "Lodge a complaint with Consumer, Building and Occupational Services (CBOS). They provide building dispute resolution services and can investigate complaints against building practitioners.",
        timeframe: "Typically 4\u201310 weeks",
        authority: "Consumer, Building and Occupational Services (CBOS)",
        url: "https://www.cbos.tas.gov.au/topics/housing-building/building-disputes",
        cost: "Free",
      },
      {
        step: 3,
        name: "Building Appeals Board / Magistrates Court",
        description:
          "If CBOS resolution is unsuccessful, escalate to the Building Appeals Board for building-specific matters or the Magistrates Court for contractual disputes and compensation claims.",
        timeframe: "3\u20139 months from application to hearing",
        authority: "Building Appeals Board / Magistrates Court of Tasmania",
        url: "https://www.cbos.tas.gov.au/topics/housing-building/building-disputes",
        cost: "Filing fee varies by claim value",
      },
    ],
  },
  ACT: {
    label: "Australian Capital Territory",
    timeLimitWarning:
      "Defect claims must be lodged within 2 years (non-structural) or 6 years (structural) from completion under the Building Act 2004.",
    steps: [
      {
        step: 1,
        name: "Written Notice to Builder",
        description:
          "Provide your builder with a formal written notice of the defect or dispute. Reference the relevant clauses of your building contract and request rectification within 14 days.",
        timeframe: "14 days for builder to respond",
        authority: "N/A (direct communication)",
        url: "",
        cost: "Free",
      },
      {
        step: 2,
        name: "Access Canberra Construction Complaints",
        description:
          "Lodge a complaint with Access Canberra (Construction Occupations Registrar). They can investigate complaints about licensed builders and attempt to facilitate resolution.",
        timeframe: "Typically 4\u201310 weeks for investigation",
        authority: "Access Canberra (Construction Occupations Registrar)",
        url: "https://www.accesscanberra.act.gov.au/s/building-and-construction",
        cost: "Free",
      },
      {
        step: 3,
        name: "ACAT Application",
        description:
          "Apply to the ACT Civil and Administrative Tribunal (ACAT) for a binding determination on the dispute. ACAT can order rectification or compensation.",
        timeframe: "3\u20136 months from application to hearing",
        authority: "ACT Civil and Administrative Tribunal (ACAT)",
        url: "https://www.acat.act.gov.au/",
        cost: "Filing fee from $85 (standard application)",
      },
    ],
  },
  NT: {
    label: "Northern Territory",
    timeLimitWarning:
      "Defect claims must be lodged within 1 year (non-structural) or 6 years (structural) from completion under the Building Act 1993.",
    steps: [
      {
        step: 1,
        name: "Written Notice to Builder",
        description:
          "Send a formal written notice to your builder detailing the defect or dispute. Include photos and reference contract clauses. Allow 14 days for a response.",
        timeframe: "14 days for builder to respond",
        authority: "N/A (direct communication)",
        url: "",
        cost: "Free",
      },
      {
        step: 2,
        name: "NT Building Advisory Services Mediation",
        description:
          "Lodge a complaint with NT Building Advisory Services. They provide mediation services and can investigate complaints about licensed builders.",
        timeframe: "Typically 4\u201310 weeks",
        authority: "NT Building Advisory Services",
        url: "https://nt.gov.au/property/building-and-development",
        cost: "Free",
      },
      {
        step: 3,
        name: "NTCAT Application",
        description:
          "Apply to the Northern Territory Civil and Administrative Tribunal (NTCAT) for a binding determination if mediation through NT Building Advisory Services does not resolve the matter.",
        timeframe: "3\u20139 months from application to hearing",
        authority: "Northern Territory Civil and Administrative Tribunal (NTCAT)",
        url: "https://ntcat.nt.gov.au/",
        cost: "Filing fee from $100 (standard application)",
      },
    ],
  },
};

const VALID_STATES: StateCode[] = ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"];

/* ------------------------------------------------------------------ */
/*  Template letter generators                                         */
/* ------------------------------------------------------------------ */

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const TEMPLATES: TemplateDef[] = [
  {
    id: "defect-notice",
    title: "Notice of Defect",
    description:
      "Formal written notice to your builder about a defect, requesting rectification within 14 days.",
    generate: (ctx: LetterContext): string =>
      `${ctx.date}

${ctx.builderName}
[Builder Address]

Dear ${ctx.builderName},

RE: NOTICE OF DEFECT \u2014 ${ctx.projectAddress}
Project: ${ctx.projectName}

I am writing to formally notify you of a defect identified at the above property, which was constructed under our building contract.

DEFECT DETAILS:
- Location: [Describe location within the property]
- Description: [Describe the defect in detail]
- Date first observed: [Date]
- Impact: [Describe how the defect affects the property or its use]

Under the terms of our building contract and the applicable state building legislation, you are required to rectify defective work at your own cost.

I hereby request that you:
1. Acknowledge receipt of this notice within 7 days.
2. Inspect the defect and provide a written rectification plan within 14 days.
3. Complete all rectification works within a reasonable timeframe to be agreed upon.

Please note that I have documented the defect with photographs and written records. Should you fail to respond or rectify the defect within the above timeframe, I will escalate this matter to the relevant state building authority.

I look forward to your prompt response and resolution of this matter.

Yours sincerely,

[Your Full Name]
[Your Address]
[Your Phone Number]
[Your Email Address]`,
  },
  {
    id: "variation-dispute",
    title: "Variation Dispute",
    description:
      "Disputing an unauthorised or overpriced variation to the building contract.",
    generate: (ctx: LetterContext): string =>
      `${ctx.date}

${ctx.builderName}
[Builder Address]

Dear ${ctx.builderName},

RE: DISPUTE OF VARIATION \u2014 ${ctx.projectAddress}
Project: ${ctx.projectName}

I am writing to formally dispute a variation that has been applied to our building contract for the above project.

VARIATION DETAILS:
- Variation Number/Reference: [Variation number]
- Date issued: [Date variation was issued]
- Amount claimed: $[Amount]
- Description: [Brief description of the variation]

GROUNDS FOR DISPUTE:
[Select and complete the applicable grounds below]

1. UNAUTHORISED VARIATION: This variation was not approved by me in writing prior to the work being carried out, as required under our building contract (Clause [X]) and the applicable state building legislation.

2. EXCESSIVE COST: The amount claimed for this variation is unreasonable and significantly exceeds the market rate for the work described. I have obtained [a quote / comparable pricing] indicating that the reasonable cost for this work is approximately $[Amount].

3. INCLUDED IN CONTRACT: The work described in this variation is already included within the scope of the original contract and does not constitute additional work.

I request that you:
1. Provide a detailed written breakdown of costs for this variation within 7 days.
2. Withdraw or reduce the variation to a fair and reasonable amount.
3. Cease any further unauthorised variations without my prior written approval.

If this matter cannot be resolved directly, I will seek assistance from the relevant state building authority or dispute resolution body.

Yours sincerely,

[Your Full Name]
[Your Address]
[Your Phone Number]
[Your Email Address]`,
  },
  {
    id: "final-notice",
    title: "Final Notice Before Tribunal",
    description:
      "Escalation letter warning of tribunal action if the matter is not resolved within 7 days.",
    generate: (ctx: LetterContext): string =>
      `${ctx.date}

${ctx.builderName}
[Builder Address]

SENT VIA REGISTERED POST AND EMAIL

Dear ${ctx.builderName},

RE: FINAL NOTICE BEFORE TRIBUNAL ACTION \u2014 ${ctx.projectAddress}
Project: ${ctx.projectName}

WITHOUT PREJUDICE SAVE AS TO COSTS

I refer to my previous correspondence dated [date of earlier notice(s)] regarding outstanding defects and/or disputes at the above property. Despite my earlier written notices, the following matters remain unresolved:

UNRESOLVED MATTERS:
1. [Describe unresolved issue 1]
2. [Describe unresolved issue 2]
3. [Describe unresolved issue 3]

I have made reasonable efforts to resolve these matters directly with you, including:
- Written notice dated [date]
- [Any other steps taken, e.g., complaint to Fair Trading / QBCC / DBDRV]

YOUR OBLIGATIONS:
Under our building contract and the applicable state building legislation, you are obligated to rectify defective and incomplete work. Your failure to do so constitutes a breach of contract.

FINAL DEMAND:
I require you to provide a written commitment to rectify all outstanding matters within 7 (seven) days of the date of this letter. Specifically:

1. Written acknowledgement of each defect/issue listed above.
2. A detailed rectification program with proposed completion dates.
3. Commencement of rectification works within 14 days of your response.

CONSEQUENCES OF INACTION:
If I do not receive a satisfactory response within 7 days, I will, without further notice:
1. Lodge a formal application with the relevant state tribunal.
2. Seek orders for rectification and/or compensation.
3. Seek recovery of all associated costs, including filing fees and professional reports.

This letter may be tendered as evidence of your failure to resolve this matter prior to tribunal proceedings.

I strongly recommend you take this matter seriously and respond within the timeframe specified.

Yours sincerely,

[Your Full Name]
[Your Address]
[Your Phone Number]
[Your Email Address]

cc: [State building authority, if applicable]`,
  },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function DisputeResolution({
  projectId: _projectId,
  stateCode = "NSW",
  builderName = "[Builder Name]",
  projectName = "[Project Name]",
  projectAddress = "[Project Address]",
}: DisputeResolutionProps) {
  const resolvedState: StateCode = VALID_STATES.includes(
    stateCode.toUpperCase() as StateCode
  )
    ? (stateCode.toUpperCase() as StateCode)
    : "NSW";

  const [activeState, setActiveState] = useState<StateCode>(resolvedState);
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const pathway = STATE_PATHWAYS[activeState];

  const letterCtx: LetterContext = {
    date: formatDate(new Date()),
    builderName,
    projectAddress,
    projectName,
  };

  const handleCopy = useCallback(
    async (templateId: string, text: string): Promise<void> => {
      try {
        await navigator.clipboard.writeText(text);
        setCopiedId(templateId);
        setTimeout(() => setCopiedId(null), 2500);
      } catch {
        /* clipboard API may be blocked */
      }
    },
    []
  );

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div className="space-y-8">
      {/* ---- Header ---- */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          Dispute Resolution
        </h2>
        <p className="text-muted-foreground mt-1">
          State-specific guidance and template letters to help resolve building
          disputes.
        </p>
      </div>

      {/* ---- State selector ---- */}
      <div className="flex flex-wrap gap-2">
        {VALID_STATES.map((sc) => (
          <button
            key={sc}
            onClick={() => setActiveState(sc)}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
              activeState === sc
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border hover:bg-muted"
            }`}
          >
            {sc}
          </button>
        ))}
      </div>

      {/* ---- Dispute pathway steps ---- */}
      <section className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-1">
          {pathway.label} Dispute Resolution Pathway
        </h3>
        <p className="text-sm text-muted-foreground mb-6">
          Follow these steps in order. Each step should be completed before
          moving to the next.
        </p>

        <div className="space-y-0">
          {pathway.steps.map((step, idx) => {
            const isLast = idx === pathway.steps.length - 1;
            return (
              <div key={step.step} className="flex gap-4">
                {/* Step indicator + connector line */}
                <div className="flex flex-col items-center">
                  <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">
                    {step.step}
                  </div>
                  {!isLast && (
                    <div className="w-0.5 bg-border flex-1 min-h-[24px]" />
                  )}
                </div>

                {/* Step content */}
                <div className={`pb-8 ${isLast ? "pb-0" : ""}`}>
                  <h4 className="font-semibold text-base">{step.name}</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {step.description}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-xs">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="font-semibold text-foreground">
                        Timeframe:
                      </span>{" "}
                      <span className="text-muted-foreground">
                        {step.timeframe}
                      </span>
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="font-semibold text-foreground">
                        Cost:
                      </span>{" "}
                      <span className="text-muted-foreground">{step.cost}</span>
                    </span>
                  </div>

                  {step.url && (
                    <a
                      href={step.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-2 text-xs text-primary underline underline-offset-2 hover:text-primary/80"
                    >
                      {step.authority} {"\u2192"}
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ---- Template letters ---- */}
      <section className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-1">Template Letters</h3>
        <p className="text-sm text-muted-foreground mb-5">
          Ready-to-use letter templates with your project details pre-filled.
          Click a template to expand, review, and copy.
        </p>

        <div className="space-y-3">
          {TEMPLATES.map((tpl) => {
            const isOpen = expandedTemplate === tpl.id;
            const letterText = tpl.generate(letterCtx);
            const isCopied = copiedId === tpl.id;

            return (
              <div
                key={tpl.id}
                className="border border-border rounded-lg overflow-hidden"
              >
                {/* Header / toggle */}
                <button
                  onClick={() =>
                    setExpandedTemplate(isOpen ? null : tpl.id)
                  }
                  className="w-full text-left px-5 py-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                >
                  <div>
                    <span className="font-medium">{tpl.title}</span>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {tpl.description}
                    </p>
                  </div>
                  <span className="text-muted-foreground text-lg shrink-0 ml-3">
                    {isOpen ? "\u2212" : "+"}
                  </span>
                </button>

                {/* Expanded content */}
                {isOpen && (
                  <div className="border-t border-border px-5 py-4 space-y-3">
                    <pre className="whitespace-pre-wrap text-sm bg-muted/40 rounded-lg p-4 max-h-[400px] overflow-y-auto font-sans leading-relaxed">
                      {letterText}
                    </pre>
                    <button
                      onClick={() => handleCopy(tpl.id, letterText)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isCopied
                          ? "bg-green-600 text-white"
                          : "bg-primary text-primary-foreground hover:bg-primary/90"
                      }`}
                    >
                      {isCopied ? "Copied to Clipboard" : "Copy to Clipboard"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ---- Important information panel ---- */}
      <section className="border-2 border-amber-400 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold flex items-center gap-2 text-amber-800 dark:text-amber-300">
          <span>{"\u26A0"}</span> Important Information
        </h3>

        <ul className="mt-4 space-y-4 text-sm">
          {/* Time limits */}
          <li className="flex gap-3">
            <span className="shrink-0 w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 flex items-center justify-center text-xs font-bold">
              !
            </span>
            <div>
              <span className="font-semibold text-foreground">
                Time Limits ({activeState})
              </span>
              <p className="text-muted-foreground mt-0.5">
                {pathway.timeLimitWarning}
              </p>
            </div>
          </li>

          {/* Evidence */}
          <li className="flex gap-3">
            <span className="shrink-0 w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 flex items-center justify-center text-xs font-bold">
              !
            </span>
            <div>
              <span className="font-semibold text-foreground">
                Document Everything
              </span>
              <p className="text-muted-foreground mt-0.5">
                Keep all evidence documented with dates and photographs.
                Maintain a log of every interaction, site visit, and
                observation. Timestamped photos and written records are critical
                evidence in tribunal proceedings.
              </p>
            </div>
          </li>

          {/* Written communication */}
          <li className="flex gap-3">
            <span className="shrink-0 w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 flex items-center justify-center text-xs font-bold">
              !
            </span>
            <div>
              <span className="font-semibold text-foreground">
                Written Communication Only
              </span>
              <p className="text-muted-foreground mt-0.5">
                Always communicate with your builder in writing (email or
                letter). Avoid relying on phone calls for dispute matters, as
                verbal agreements are difficult to prove. If you do speak by
                phone, follow up with a written summary sent via email.
              </p>
            </div>
          </li>
        </ul>
      </section>
    </div>
  );
}
