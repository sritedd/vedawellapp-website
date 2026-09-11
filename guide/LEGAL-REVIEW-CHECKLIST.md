# Legal review checklist — one hour, every quarter

> Guardian's differentiator is state-specific rules, and they drift. On
> 2026-09-09 every licence-register link in the product was dead or wrong, NT's
> insurance scheme had been wrong since 2012, and the app told ACT owners they
> had a five-day cooling-off period that does not exist. None of that was caught
> by a type-check or a code review — only by opening the pages.
>
> Run this every quarter. It takes about an hour. Where a figure changes, update
> the value **and** its `lastVerified` / `source` in the same commit.

**Next due**: 2026-12-09 · **Last completed**: 2026-09-09

---

## Before you start

```bash
node scripts/check-gov-links.mjs
```

It fetches every `gov.au` URL in the product. `FAIL` means dead for a real user
too — fix before anything else. `WARN 403` means the site blocks scripts; those
are the ones you must open in a real browser below. (It also runs monthly in CI:
`.github/workflows/gov-links.yml`.)

---

## Where the figures live

| What | File | Fields |
|---|---|---|
| Insurance scheme, threshold, verify link | `src/lib/guardian/calculations.ts` → `STATE_INSURANCE` | `scheme`, `threshold`, `verifyUrl`, `note`, `lastVerified`, `source` |
| Cooling-off days + citation | same file → `STATE_COOLING_OFF` | `days`, `note`, `lastVerified`, `source` |
| Licence register per state | same file → `getLicenseVerificationUrl` | plus `LICENSE_REGISTER_LAST_VERIFIED` |
| Warranty periods | same file → `STATE_WARRANTY_PERIODS` | structural / non-structural years |
| Regulator, planning portal, dispute links | `src/data/australian-build-workflows.json` | `regulatorUrl`, `usefulLinks` |
| Tribunal contacts | `src/lib/guardian/tribunal-info.ts` | name, phone, fair trading |

Anything user-facing that asserts a rule must render `<VerifiedAt />` next to it.

---

## The eight states

For each: open the register (does a homeowner reach a working search?), confirm
the insurance scheme name and threshold, confirm the cooling-off period and the
Act it cites, and confirm the tribunal contact still exists.

### NSW — *verified 2026-09-09*
- Register: `verify.licence.nsw.gov.au/home/Trades`
- Insurance: HBCF, work over **$20,000** — icare
- Cooling-off: **5 business days**, Home Building Act 1989 s.7BA (contracts over $20,000)
- Tribunal: NCAT · ☐ re-checked

### VIC — *verified 2026-09-09* · **watch this one**
- Register: `bpc.vic.gov.au/find-and-check-a-practitioner` (the VBA became the Building and Plumbing Commission)
- Insurance: **Home Warranty** for contracts signed on/after **1 July 2026**, over **$20,000**, BPC the sole provider. Earlier contracts keep **DBI** (threshold was $16,000).
- ☐ Confirm the cut-over is bedded in and the DBI wording is still needed
- Cooling-off: 5 business days, Domestic Building Contracts Act 1995
- Tribunal: VCAT · ☐ re-checked

### QLD — *verified 2026-09-09*
- Register: `my.qbcc.qld.gov.au/myQBCC/s/qbcc-licensee-register`
- Insurance: QBCC Home Warranty, work over **$3,300**
- Cooling-off: 5 business days, QBCC Act 1991 Sch 1B s.35
- Tribunal: QCAT · ☐ re-checked

### WA — *verified 2026-09-09* · **watch this one**
- Register: `wa.gov.au/service/business-support/professional-accreditation/find-registered-building-service-provider`
- Insurance: Home Indemnity Insurance, work over **$20,000**
- Cooling-off: **none** — WA home building contracts are not required to include one
- ☐ A review of the Home Building Contracts Act 1991 was underway in 2026 and lists cooling-off periods among its topics. Check whether it has reported.
- Tribunal: SAT / Building Commission · ☐ re-checked

### SA — *verified 2026-09-09*
- Register: `secure.cbs.sa.gov.au/OccLicPubReg/` (blocks scripts — open in a browser)
- Insurance: Building Indemnity Insurance, council-approved work costing **$20,000 or more** (raised from $12,000 on 10 Nov 2025)
- Cooling-off: 5 clear business days, Building Work Contractors Act 1995
- Tribunal: SACAT · ☐ re-checked

### TAS — *verified 2026-09-09* · **watch this one**
- Register: `cbos.tas.gov.au/topics/licensing-and-registration/search-licensed-occupations`
- Insurance: Home Warranty Insurance was legislated in 2023 (contracts over $20,000) but **commences by proclamation** and no date had been published.
- ☐ **Check whether the 2023 Act has commenced.** If it has, the scheme name, threshold and note all change, and it stops being optional.
- Cooling-off: 5 business days, Residential Building Work Contracts and Dispute Resolution Act 2016
- Tribunal: Magistrates Court (Civil) · ☐ re-checked

### ACT — *verified 2026-09-09*
- Register: `accesscanberra.act.gov.au/business-and-work/public-registers`
- Insurance: residential building work insurance **or** a Master Builders Fidelity Fund certificate, work over **$12,000**; max cover $85,000
- Cooling-off: **none** for residential building contracts
- Tribunal: ACAT · ☐ re-checked

### NT — *verified 2026-09-09*
- Register: `nt.gov.au/property/building/build-or-renovate-your-home/check-if-your-builder-is-registered` (blocks scripts)
- Insurance: residential building cover as a **fidelity fund certificate**, prescribed work over **$12,000**. (The old Home Building Certification Fund stopped issuing policies on 31 Dec 2012 — do not reintroduce that name.)
- Cooling-off: none found for residential building contracts
- Tribunal: NTCAT · ☐ re-checked

---

## Finishing

1. Bump `lastVerified` on everything you actually opened — not on what you assumed.
2. Bump `LICENSE_REGISTER_LAST_VERIFIED` if you checked all eight registers.
3. Update **Last completed** and **Next due** at the top of this file.
4. Commit with what changed and what you checked against; a legal figure change
   is the owner's call, not a silent edit.
5. If a rule moved in a way that affects money (a threshold, a cooling-off
   period), say so in the release note — an owner may have planned around the
   old number.
