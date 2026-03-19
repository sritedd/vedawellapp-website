-- seed_knowledge_base.sql
-- Seed the knowledge_base table with NCC and Australian Standards references
-- for RAG-powered AI responses in HomeOwner Guardian.
--
-- Run via Supabase SQL Editor after schema_v20_ai.sql has been applied.
-- These entries do NOT require embeddings — they serve as keyword-searchable
-- domain knowledge that AI prompts can reference.

-- ─── National Construction Code (NCC) 2025 ───────────────────────

INSERT INTO knowledge_base (content, category, state, stage) VALUES

-- Volume 1: Class 2–9 buildings (apartments, commercial)
('NCC 2025 Volume 1 covers Class 2 to 9 buildings. For residential apartments (Class 2), key requirements include fire safety (Part C), health and amenity (Part F), energy efficiency (Part J), and accessibility (Part D). All apartment builds must comply with livable housing provisions under Part G7.', 'ncc', NULL, NULL),

-- Volume 2: Class 1 and 10 (houses, sheds)
('NCC 2025 Volume 2 covers Class 1 (houses, townhouses) and Class 10 (sheds, carports, swimming pools). Key sections: Part 2.2 (damp and weatherproofing), Part 2.4 (health and amenity), Part 2.6 (energy efficiency — minimum 7-star NatHERS), Part 3.12 (site preparation and earthworks).', 'ncc', NULL, NULL),

-- Energy efficiency (NatHERS 7-star)
('NCC 2025 requires a minimum 7-star NatHERS energy rating for new Class 1 buildings. This is up from the previous 6-star requirement. Key compliance areas: wall insulation (R-values), ceiling insulation, glazing (U-values and SHGC), air leakage sealing, and whole-of-home energy budget. Builders must provide a NatHERS certificate from an accredited assessor before the energy assessment stage.', 'ncc', NULL, 'frame'),

-- Condensation management (new in NCC 2025)
('NCC 2025 introduced mandatory condensation management provisions under Part 3.8.7 (Volume 2). Builders must install vapour barriers, manage air leakage, and ensure adequate ventilation in roof spaces and subfloor areas. This is a new requirement that many builders are unfamiliar with. Homeowners should request a condensation management plan and verify vapour barrier installation during the frame stage inspection.', 'ncc', NULL, 'frame'),

-- Livable housing provisions
('NCC 2025 Part G7 requires all new houses and apartments to meet Gold level livable housing design (formerly known as Livable Housing Design Guidelines). Key requirements: step-free entry, wider doorways (minimum 820mm clear opening), reinforced bathroom walls for future grab rails, accessible toilet on entry level. Builders must comply from 1 October 2025 — this is mandatory, not optional.', 'ncc', NULL, 'slab'),

-- Fire safety
('NCC 2025 fire safety requirements for Class 1 buildings include: smoke alarm compliance (interconnected, in every bedroom + hallway), bushfire attack level (BAL) compliance in designated areas, fire-rated construction between attached dwellings, and adequate egress. Builders must provide a smoke alarm compliance certificate at handover.', 'ncc', NULL, 'fixout'),

-- Waterproofing
('Australian Standard AS 3740-2021 covers waterproofing of domestic wet areas. Key requirements: all shower recesses, laundry floors, and bathroom floors must be waterproofed to the standard. Waterproofing must extend 150mm above finished floor level for the entire room, 1800mm in shower areas. The waterproofer must provide a certificate of compliance before tiling begins. This is a critical defect area — failed waterproofing is the #1 building defect in Australia.', 'australian_standard', NULL, 'fixout'),

-- Structural
('Australian Standard AS 2870-2011 covers residential slabs and footings. The standard requires a geotechnical (soil) report classifying the site (Class A = stable, through to Class P = problem). The footing design must match the soil classification. Homeowners should obtain the soil report and verify it matches the engineering drawings before slab pour. Common issue: builders use a generic Class S design on Class M or H sites, leading to cracking.', 'australian_standard', NULL, 'slab'),

-- Timber framing
('Australian Standard AS 1684 covers residential timber-framed construction. Key inspection points at frame stage: correct timber grade and size per engineering, adequate bracing, correct tie-down connections (especially in cyclone areas), proper bearer and joist spacing, and correct lintel sizes over openings. Frame must be inspected and approved before lining/cladding begins.', 'australian_standard', NULL, 'frame'),

-- Electrical
('Australian Standard AS/NZS 3000:2018 (Wiring Rules) covers all electrical work in residential buildings. Key requirements: all electrical work must be done by a licensed electrician, a Certificate of Compliance (CCEW) must be issued for all work, RCDs (safety switches) must protect all circuits, and smoke alarms must comply with AS 3786. Homeowners should demand the CCEW at practical completion.', 'australian_standard', NULL, 'fixout'),

-- Plumbing
('Australian Standard AS/NZS 3500 covers plumbing and drainage. Key requirements: all plumbing must be done by a licensed plumber, compliance certificates must be issued, hot water tempering valves must limit water to 50°C at bathroom outlets (scalding prevention), and stormwater must be connected to approved drainage. Common issue: inadequate fall on drainage pipes causing blockages.', 'australian_standard', NULL, 'lockup'),

-- Glazing
('Australian Standard AS 1288 covers glass in buildings. Key safety glazing requirements: all glass in doors, sidelights, and below 800mm must be safety glass (toughened or laminated). Glass near wet areas, stairs, and balustrades has specific requirements. Energy-efficient glazing must meet NCC 2025 U-value and SHGC requirements. Homeowners should check glass markings (stamp in corner) to verify safety glass compliance.', 'australian_standard', NULL, 'lockup');

-- ─── State-Specific Regulations ──────────────────────────────────

INSERT INTO knowledge_base (content, category, state, stage) VALUES

-- NSW
('NSW Home Building Act 1989: Residential building work over $5,000 requires a licensed contractor. Homeowners must receive a written contract for work over $20,000. Home Building Compensation Fund (HBCF) insurance is mandatory for work over $20,000 (covers up to $340,000). Progress payment limits: deposit max 10%, then stage payments per schedule. Cooling-off period: 5 business days from contract exchange. Warranty: 6 years structural, 2 years non-structural. Disputes: NSW Fair Trading, then NCAT.', 'regulation', 'NSW', NULL),

-- VIC
('Victorian Building Act 1993 and Domestic Building Contracts Act 1995: Registered Building Practitioner required for all domestic building work. Domestic building insurance is mandatory for work over $16,000. Progress payment limits defined in Schedule 2 of DBCA. Cooling-off period: 5 business days. Warranty: 10 years structural, 6 years non-structural (longest in Australia). Disputes: Domestic Building Dispute Resolution Victoria (DBDRV), then VCAT.', 'regulation', 'VIC', NULL),

-- QLD
('QLD Building Act 1975 and QBCC Act 1991: QBCC-licensed contractor required for all residential work over $3,300. Home warranty insurance provided by QBCC (covers up to $200,000). Progress payment limits: 5% deposit, then per contract schedule. Cooling-off period: 5 business days. Warranty: 6 years 6 months structural, 12 months non-structural. Defect claims must be lodged with QBCC within warranty period. Disputes: QBCC Direction to Rectify, then QCAT.', 'regulation', 'QLD', NULL),

-- WA
('WA Building Act 2011 and Home Building Contracts Act 1991: Registered building contractor required. Home indemnity insurance mandatory for work over $20,000 (covers up to $200,000). Progress payments: deposit max 6.5% (not exceeding $21,000). Cooling-off period: 5 business days. Warranty: 6 years structural, 6 years non-structural. Disputes: Building Commission conciliation, then SAT (State Administrative Tribunal).', 'regulation', 'WA', NULL),

-- SA
('SA Building Work Contractors Act 1995: Licensed building work contractor required. Building indemnity insurance mandatory for work over $12,000. No statutory progress payment limits (contract governs). Cooling-off period: 5 business days for contracts over $12,000. Warranty: 5 years structural, 5 years non-structural. Disputes: Consumer and Business Services SA conciliation, then SACAT.', 'regulation', 'SA', NULL),

-- TAS
('TAS Building Act 2016: Licensed builder required for work over $20,000. Home warranty insurance mandatory for work over $20,000. No statutory progress payment schedule (contract governs). Cooling-off period: 5 business days. Warranty: 6 years structural, 2 years non-structural. Disputes: Consumer Building and Occupational Services (CBOS), then Magistrates Court.', 'regulation', 'TAS', NULL),

-- ACT
('ACT Building Act 2004: Licensed builder required for all residential building work. Fidelity fund (Building Regulatory Authority) covers owner-builder and licensed work. Progress payments per contract. Cooling-off period: 5 business days. Warranty: 6 years structural, 2 years non-structural. Disputes: Access Canberra, then ACAT (ACT Civil and Administrative Tribunal).', 'regulation', 'ACT', NULL),

-- NT
('NT Building Act 1993: Licensed builder required. Building Practitioners Board regulates. No mandatory home warranty insurance scheme (highest risk for homeowners — consider private insurance). Progress payments per contract. Cooling-off period: 4 business days. Warranty: periods vary by contract (no statutory minimum — critical to negotiate). Disputes: NT Building Advisory Services, then Local Court.', 'regulation', 'NT', NULL);

-- ─── Construction Stage Guidance ─────────────────────────────────

INSERT INTO knowledge_base (content, category, state, stage) VALUES

-- Slab/Foundation
('SLAB STAGE: Critical inspection points for residential slab pours: 1) Verify soil classification matches engineering (Class A/S/M/H/E/P per AS 2870). 2) Check reinforcement placement (mesh or reo bars) matches structural drawings — correct cover, correct size, correct spacing. 3) Verify formwork dimensions match plans. 4) Check plumbing rough-in is correct (very hard to fix after pour). 5) Ensure moisture barrier is installed (200mm overlap, sealed). 6) Arrange pre-pour inspection by building surveyor. 7) Photograph everything before concrete is poured — you cannot see inside the slab after. Payment: typically 10-15% of contract at slab completion.', 'stage_guide', NULL, 'slab'),

-- Frame
('FRAME STAGE: Critical inspection points: 1) Frame must be inspected and approved by building surveyor before lining. 2) Check all timber sizes, grades, and spacings match structural drawings. 3) Verify bracing installation (diagonal bracing, sheet bracing) per AS 1684 or engineered design. 4) Check tie-downs and hold-downs at corners, openings, and along walls. 5) Verify window and door openings match plans — correct size, correct location. 6) Check roof framing: truss spacing, ridge, hip, and valley connections. 7) Inspect plumbing and electrical rough-in before lining. 8) Check insulation and vapour barriers per NCC 2025 condensation requirements. Payment: typically 15-20% at frame stage.', 'stage_guide', NULL, 'frame'),

-- Lockup
('LOCKUP STAGE: The building is weather-tight (roof complete, external cladding, windows and doors installed). Inspection points: 1) Check roofing (tiles/metal) is complete and flashed correctly. 2) Verify all windows and doors are installed, opening correctly, and sealed. 3) Check external cladding is complete and weatherproofed (sarking behind cladding). 4) Inspect fascia, gutters, and downpipes. 5) Check that the building is secure (all external doors lock). 6) Verify external waterproofing (window flashings, wall junctions). Payment: typically 20-25% at lockup.', 'stage_guide', NULL, 'lockup'),

-- Fixout
('FIXOUT STAGE: Internal fit-out is underway (plumbing fixtures, electrical, cabinetry, tiling). Inspection points: 1) Verify waterproofing certificate for all wet areas BEFORE tiling (AS 3740). 2) Check all plumbing fixtures are installed correctly and to specification. 3) Inspect electrical — outlets, switches, lighting match plans. 4) Check cabinetry and joinery quality and alignment. 5) Inspect tiling — level, grouted, no hollow tiles (tap test). 6) Verify smoke alarm installation (interconnected, every bedroom + hallway per NCC). 7) Check internal door hardware. Payment: typically 20-25% at fixout.', 'stage_guide', NULL, 'fixout'),

-- Practical Completion
('PRACTICAL COMPLETION: The build is substantially complete and ready for handover. This is the most important inspection. Steps: 1) Do a thorough pre-handover inspection (use HomeOwner Guardian checklist — 65+ items). 2) Document ALL defects with photos before signing. 3) Do NOT sign the completion certificate until all defects are rectified or a formal defect list is attached. 4) Request all certificates: waterproofing, electrical (CCEW), plumbing compliance, smoke alarm, termite barrier, energy rating, and occupation certificate. 5) Ensure builder provides all warranties and manuals. 6) Final payment (5-10% retention) should only be made after defect rectification. 7) Start your warranty clock — document the handover date.', 'stage_guide', NULL, 'completion');

-- ─── Common Defect Categories ────────────────────────────────────

INSERT INTO knowledge_base (content, category, state, stage) VALUES

('WATERPROOFING DEFECTS: The most common and costly building defect in Australia. Warning signs: water stains on ceilings below bathrooms, mould in wet area corners, damp patches on walls adjacent to showers, cracking grout in showers. Prevention: demand waterproofing certificate (AS 3740) before tiling, photograph membrane installation, ensure correct turn-up heights (150mm room, 1800mm shower). Rectification cost: $5,000–$30,000+ depending on extent. Always report immediately — water damage worsens rapidly.', 'defect_guide', NULL, NULL),

('STRUCTURAL CRACKING: Cracks wider than 2mm or showing differential movement (one side higher than other) may indicate foundation problems. Reference AS 2870 and CSIRO Guide to Crack Identification. Hairline cracks (<0.5mm) in plasterwork are usually cosmetic (shrinkage). Cracks radiating from window/door corners are common but should be monitored. Stair-step cracking in brickwork suggests foundation movement. Always photograph cracks with a ruler for scale and monitor over time. If structural cracking suspected, engage an independent structural engineer — do NOT rely on the builder''s assessment.', 'defect_guide', NULL, NULL),

('TILING DEFECTS: Common issues: hollow tiles (delaminated from substrate — tap test reveals hollow sound), lippage (uneven tile edges), incorrect falls in shower/wet areas (water should drain to floor waste), cracked tiles, poor grouting, incorrect tile adhesive for application. Reference AS 3958.1. Hollow tiles are a major defect — they will crack and lift over time. Wet area falls must be minimum 1:80 to floor waste. Report tiling defects before grouting is complete where possible.', 'defect_guide', NULL, NULL),

('PAINTING AND FINISHING DEFECTS: Common issues: poor surface preparation (brush marks, roller marks, missed patches), paint on fixtures, inconsistent colour, visible joints in plasterboard, nail pops in plasterboard, uneven cornice joints, scratches on fixtures. While cosmetic, these indicate overall build quality. Inspect all painted surfaces in good natural light and from multiple angles. Skirting boards, architraves, and cornice should have clean, consistent finish. Document with close-up photos.', 'defect_guide', NULL, NULL),

('DRAINAGE AND STORMWATER DEFECTS: Common issues: inadequate site drainage (water pooling near foundation), incorrect pipe falls, disconnected downpipes, missing overflow relief gullies, stormwater connected to sewer (illegal). Surface water must drain AWAY from the building. Check after rain — photograph any pooling within 1.5m of the building. Poor drainage is a leading cause of foundation movement. Reference AS/NZS 3500.3 for stormwater requirements.', 'defect_guide', NULL, NULL);
