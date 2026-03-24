/**
 * Builder escalation letter templates — 4 levels.
 * Each returns a professional letter body string.
 */

const STATE_REGULATOR: Record<string, string> = {
  NSW: "NSW Fair Trading",
  VIC: "Domestic Building Dispute Resolution Victoria (DBDRV)",
  QLD: "Queensland Building and Construction Commission (QBCC)",
  WA: "WA Building Commission",
  SA: "Consumer and Business Services (CBS)",
  TAS: "Consumer, Building and Occupational Services (CBOS)",
  ACT: "Access Canberra",
  NT: "NT Building Advisory Services",
};

const STATE_TRIBUNAL: Record<string, string> = {
  NSW: "NSW Civil and Administrative Tribunal (NCAT)",
  VIC: "Victorian Civil and Administrative Tribunal (VCAT)",
  QLD: "Queensland Civil and Administrative Tribunal (QCAT)",
  WA: "State Administrative Tribunal (SAT)",
  SA: "South Australian Civil and Administrative Tribunal (SACAT)",
  TAS: "Magistrates Court of Tasmania",
  ACT: "ACT Civil and Administrative Tribunal (ACAT)",
  NT: "Northern Territory Civil and Administrative Tribunal (NTCAT)",
};

export interface TemplateParams {
  homeownerName: string;
  builderName: string;
  defectDescription: string;
  projectAddress: string;
  daysSinceReport: number;
  state: string;
}

export function getFriendlyReminder(p: TemplateParams): string {
  return `Dear ${p.builderName},

I am writing regarding my residential building project at ${p.projectAddress}.

I reported the following defect ${p.daysSinceReport} day(s) ago and have not yet received a response:

"${p.defectDescription}"

Could you please provide an update on when this will be addressed? I would appreciate a proposed timeline for rectification at your earliest convenience.

I understand construction projects involve many moving parts, and I look forward to resolving this together.

Kind regards,
${p.homeownerName}`;
}

export function getFormalNotice(p: TemplateParams): string {
  const regulator = STATE_REGULATOR[p.state] || "your state's building authority";

  return `FORMAL WRITTEN NOTICE — DEFECT RECTIFICATION

Date: ${new Date().toLocaleDateString("en-AU")}
To: ${p.builderName}
From: ${p.homeownerName}
Re: Building project at ${p.projectAddress}

Dear ${p.builderName},

This letter serves as formal written notice pursuant to the Home Building Act and relevant ${p.state} building legislation.

DEFECT DETAILS:
${p.defectDescription}

This defect was first reported ${p.daysSinceReport} day(s) ago and remains unresolved.

REQUIRED ACTION:
You are required to rectify the above defect(s) within 14 calendar days of the date of this notice, in accordance with your obligations under the building contract and applicable legislation.

NOTICE OF REGULATORY ACTION:
If the defect is not rectified within the specified timeframe, I intend to:
1. Lodge a formal complaint with ${regulator}
2. Seek further remedies available under ${p.state} building legislation

Please acknowledge receipt of this notice in writing.

Yours faithfully,
${p.homeownerName}`;
}

export function getFairTradingComplaint(p: TemplateParams): string {
  const regulator = STATE_REGULATOR[p.state] || "the state building authority";

  return `FORMAL COMPLAINT — ${regulator.toUpperCase()}

Date: ${new Date().toLocaleDateString("en-AU")}
Complainant: ${p.homeownerName}
Builder: ${p.builderName}
Property: ${p.projectAddress}

Dear Sir/Madam,

I wish to lodge a formal complaint regarding defective building work at the above property.

BACKGROUND:
I engaged ${p.builderName} as the builder for my residential construction project at ${p.projectAddress}.

NATURE OF COMPLAINT:
${p.defectDescription}

TIMELINE:
- Defect first reported to builder: ${p.daysSinceReport} day(s) ago
- Friendly reminder sent: Yes
- Formal written notice issued: Yes (14-day deadline expired)
- Builder response: None / Inadequate

EVIDENCE AVAILABLE:
- Photographs of the defect (timestamped)
- Written communication log with builder
- Formal notice letter (copy attached)
- Building contract and relevant specifications

OUTCOME SOUGHT:
I request that ${regulator} investigate this matter and facilitate the rectification of the identified defect(s) by the builder.

Yours faithfully,
${p.homeownerName}`;
}

export function getTribunalApplication(p: TemplateParams): string {
  const tribunal = STATE_TRIBUNAL[p.state] || "the relevant tribunal";

  return `APPLICATION FOR DISPUTE RESOLUTION — ${tribunal.toUpperCase()}

Date: ${new Date().toLocaleDateString("en-AU")}
Applicant: ${p.homeownerName}
Respondent: ${p.builderName}
Property: ${p.projectAddress}

APPLICATION SUMMARY:

1. PARTIES
   Applicant (Homeowner): ${p.homeownerName}
   Respondent (Builder): ${p.builderName}

2. PROPERTY
   ${p.projectAddress}

3. NATURE OF DISPUTE
   Defective building work — the respondent has failed to rectify the following defect despite formal notification:

   "${p.defectDescription}"

4. CHRONOLOGY
   - Defect identified and reported: ${p.daysSinceReport} days ago
   - Level 1 — Friendly reminder sent to builder
   - Level 2 — Formal written notice issued (14-day rectification period)
   - Level 3 — Complaint lodged with ${STATE_REGULATOR[p.state] || "state regulator"}
   - Level 4 — This tribunal application

5. EVIDENCE
   The applicant holds the following evidence:
   - Timestamped photographs of defect(s)
   - Complete communication log with respondent
   - Copy of building contract
   - Formal notice letter and proof of delivery
   - Regulatory complaint reference number
   - Expert reports (if applicable)

6. ORDERS SOUGHT
   a) An order that the respondent rectify the defect(s) within a specified timeframe
   b) Alternatively, compensation for the cost of engaging another builder to rectify
   c) Costs of the application

${p.homeownerName}`;
}

export const ESCALATION_LEVELS = [
  { level: 1, name: "Friendly Reminder", color: "blue", generator: getFriendlyReminder },
  { level: 2, name: "Formal Written Notice", color: "yellow", generator: getFormalNotice },
  { level: 3, name: "Fair Trading Complaint", color: "orange", generator: getFairTradingComplaint },
  { level: 4, name: "Tribunal Application", color: "red", generator: getTribunalApplication },
] as const;
