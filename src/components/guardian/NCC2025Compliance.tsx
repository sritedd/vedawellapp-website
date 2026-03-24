"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/guardian/Toast";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface NCC2025ComplianceProps {
  projectId: string;
  stateCode?: string;
  buildCategory?: string;
}

interface ChecklistItem {
  id: string;
  label: string;
  info: string;
}

interface ComplianceSection {
  key: string;
  title: string;
  description: string;
  items: ChecklistItem[];
}

interface StateNote {
  code: string;
  note: string;
}

interface BuilderShortcut {
  id: string;
  text: string;
}

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const SECTIONS: ComplianceSection[] = [
  {
    key: "nathers",
    title: "NatHERS Energy Rating (7-Star Minimum)",
    description:
      "From October 2023, all new homes must achieve a minimum 7-star NatHERS rating (up from 6-star). A whole-of-home annual energy budget also applies.",
    items: [
      {
        id: "nathers-cert",
        label: "NatHERS certificate obtained (7-star or above)",
        info: "Your builder must provide a NatHERS certificate showing at least 7 stars. Anything below 7 is non-compliant under NCC 2025.",
      },
      {
        id: "nathers-asbuilt",
        label: "Certificate matches final as-built plans (not just DA plans)",
        info: "Many builders use the original DA plans for the certificate, but changes during construction can reduce the rating. Insist on an as-built assessment.",
      },
      {
        id: "nathers-ceiling-insulation",
        label: "Ceiling insulation meets minimum R-value (R4.0 for most climate zones)",
        info: "Ceiling insulation is the single biggest contributor to thermal performance. R4.0 is the minimum for most zones; some zones require R5.0 or above.",
      },
      {
        id: "nathers-wall-insulation",
        label: "Wall insulation installed as per energy report",
        info: "Wall insulation is frequently skipped or downgraded. Verify the R-value matches the energy report exactly.",
      },
      {
        id: "nathers-glazing",
        label: "Double/triple glazing installed where specified",
        info: "Energy reports often specify double glazing on certain orientations. Single glazing in those locations will fail compliance.",
      },
      {
        id: "nathers-shading",
        label: "External shading devices installed as per plans",
        info: "Eaves, awnings, and external blinds specified in the energy report must be installed. They are part of the compliance pathway.",
      },
      {
        id: "nathers-led",
        label: "LED lighting throughout (no halogen)",
        info: "The whole-of-home energy budget counts lighting. Halogen downlights use 5-10x more energy than LED equivalents.",
      },
      {
        id: "nathers-solar",
        label: "Solar PV system installed if specified in energy report",
        info: "If the energy report relies on solar PV to meet the energy budget, it must be installed before occupancy.",
      },
      {
        id: "nathers-hotwater",
        label:
          "Hot water system matches energy report specification (heat pump preferred)",
        info: "Hot water is typically 25% of home energy use. Heat pumps are 3-4x more efficient than electric storage. The system must match the energy report.",
      },
      {
        id: "nathers-draught",
        label: "Draught sealing on external doors and windows",
        info: "Air leakage can reduce a home's effective star rating by 1-2 stars. All external openings need weather seals.",
      },
    ],
  },
  {
    key: "livable",
    title: "Livable Housing Design (Silver Level Minimum)",
    description:
      "From October 2023, all new Class 1a dwellings (houses) must meet Silver level accessibility standards under the Livable Housing Design Guidelines.",
    items: [
      {
        id: "livable-stepfree",
        label: "Step-free entry to dwelling (no step > 5mm at main entry)",
        info: "At least one entry must be step-free (maximum 5mm lip). This allows wheelchair and mobility-aid access now and in the future.",
      },
      {
        id: "livable-doorways",
        label: "Internal doorways minimum 820mm clear opening",
        info: "Standard 720mm doors do not allow wheelchair access. All internal doors must provide at least 820mm clear opening width.",
      },
      {
        id: "livable-corridors",
        label: "Internal corridors minimum 1000mm wide",
        info: "Corridors must be at least 1000mm wide to allow a wheelchair or walking frame to pass through comfortably.",
      },
      {
        id: "livable-toilet",
        label:
          "Toilet on entry/ground level with 1200mm x 900mm clear space",
        info: "A ground-level toilet with adequate clear space ensures accessibility without needing to navigate stairs.",
      },
      {
        id: "livable-grabrails",
        label:
          "Reinforced walls in bathroom/toilet for future grab rail installation",
        info: "Walls must have timber nogging or plywood backing so grab rails can be installed later without major renovation.",
      },
      {
        id: "livable-slipresist",
        label: "Slip-resistant flooring in wet areas",
        info: "Wet area floors must meet slip resistance classifications (P3/R10 minimum). Standard polished tiles do not comply.",
      },
      {
        id: "livable-switches",
        label: "Light switches at 900-1100mm height",
        info: "Switches at this height are reachable from a seated position and comfortable for most people.",
      },
      {
        id: "livable-powerpoints",
        label: "Power points at minimum 300mm from floor",
        info: "Power points at 300mm or higher reduce the need to bend down, improving accessibility and convenience.",
      },
    ],
  },
  {
    key: "condensation",
    title: "Condensation Management",
    description:
      "NCC 2025 introduces new requirements for managing moisture within the building envelope. Poor condensation management causes mould, rot, and structural damage.",
    items: [
      {
        id: "cond-assessment",
        label: "Condensation risk assessment completed for climate zone",
        info: "A formal condensation risk assessment identifies where moisture problems may occur based on your climate zone and building design.",
      },
      {
        id: "cond-wallwrap",
        label:
          "Vapour permeable wall wrap installed (not just generic building wrap)",
        info: "Vapour-permeable wraps allow moisture to escape the wall cavity. Non-permeable wraps (like foil-based products) can trap moisture and cause rot.",
      },
      {
        id: "cond-mechvent",
        label:
          "Mechanical ventilation in wet areas (exhaust fans ducted to outside)",
        info: "Exhaust fans must be ducted to the outside, not just into the roof space. Dumping moist air into the roof causes condensation and mould.",
      },
      {
        id: "cond-subfloor",
        label: "Sub-floor ventilation adequate (for suspended floors)",
        info: "Suspended timber floors need adequate cross-ventilation underneath to prevent moisture buildup and timber decay.",
      },
      {
        id: "cond-roofvent",
        label: "Roof space ventilation adequate (whirlybirds or similar)",
        info: "Roof spaces can reach extreme temperatures and humidity. Ventilation prevents condensation on the underside of the roof sheeting.",
      },
      {
        id: "cond-vapourbarrier",
        label:
          "No polyethylene vapour barrier on warm side of insulation in humid climates",
        info: "In humid climates (northern Australia), a poly vapour barrier on the warm side traps moisture inside the wall. This is a serious defect.",
      },
      {
        id: "cond-exhaustrate",
        label: "Bathroom exhaust fans minimum 25L/s flow rate",
        info: "Undersized exhaust fans cannot remove moisture quickly enough. 25 litres per second is the minimum effective rate for a standard bathroom.",
      },
    ],
  },
];

const STATE_NOTES: StateNote[] = [
  {
    code: "NSW",
    note: "BASIX certificate must reflect 7-star NatHERS compliance. Check that your BASIX certificate was issued after 1 October 2023 and references the updated energy targets.",
  },
  {
    code: "VIC",
    note: "Victoria adopted NCC 2025 requirements from 1 May 2024 (later than other states). Building permits lodged before this date may still use 6-star requirements.",
  },
  {
    code: "QLD",
    note: "QBCC enforces NCC 2025 compliance at inspection stages. Your private certifier and QBCC inspector should both verify 7-star compliance.",
  },
  {
    code: "WA",
    note: "NCC 2025 applies to all building permit applications lodged from May 2024. Check your permit lodgement date to confirm which code version applies.",
  },
  {
    code: "SA",
    note: "7-star NatHERS is mandatory for all new dwellings from October 2024. South Australia adopted later than NSW and QLD.",
  },
];

const BUILDER_SHORTCUTS: BuilderShortcut[] = [
  {
    id: "shortcut-old-cert",
    text: "Using old 6-star NatHERS certificates from DA stage instead of obtaining a new 7-star as-built certificate",
  },
  {
    id: "shortcut-wall-insulation",
    text: "Skipping wall insulation or using a lower R-value than specified to save costs",
  },
  {
    id: "shortcut-tiles",
    text: "Installing standard (not slip-resistant) tiles in wet areas \u2014 check the tile slip rating on the box",
  },
  {
    id: "shortcut-grabrails",
    text: "Not reinforcing bathroom walls with nogging for future grab rail installation",
  },
  {
    id: "shortcut-wrap",
    text: "Using non-permeable reflective building wrap (e.g. Sisalation) instead of vapour-permeable wrap as required",
  },
];

/* ------------------------------------------------------------------ */
/*  Chevron icon (inline SVG to avoid emoji)                           */
/* ------------------------------------------------------------------ */

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`w-5 h-5 transition-transform ${open ? "rotate-90" : ""}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg
      className="w-4 h-4 text-muted-foreground shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <circle cx="12" cy="12" r="10" />
      <path strokeLinecap="round" d="M12 16v-4M12 8h.01" />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg
      className="w-5 h-5 text-red-600 shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
      />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg
      className="w-6 h-6 text-green-600 shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function NCC2025Compliance({
  projectId,
  stateCode = "NSW",
  buildCategory = "new_build",
}: NCC2025ComplianceProps) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    nathers: true,
    livable: false,
    condensation: false,
  });
  const [tooltipOpen, setTooltipOpen] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const { toast } = useToast();

  const supabase = createClient();

  /* Load from Supabase on mount */
  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase
          .from("ncc_checklist_items")
          .select("item_key, checked")
          .eq("project_id", projectId);

        if (data && data.length > 0) {
          const map: Record<string, boolean> = {};
          for (const row of data) {
            map[row.item_key] = row.checked;
          }
          setChecked(map);
        }
      } catch {
        // ignore errors — start unchecked
      }
      setLoaded(true);
    })();
  }, [projectId, supabase]);

  const toggleItem = useCallback(async (id: string) => {
    const newVal = !checked[id];
    setChecked((prev) => ({ ...prev, [id]: newVal }));
    if (newVal) toast("Item verified", "success");

    // Persist to Supabase
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("ncc_checklist_items")
      .upsert({
        project_id: projectId,
        user_id: user.id,
        item_key: id,
        checked: newVal,
        checked_at: newVal ? new Date().toISOString() : null,
      }, { onConflict: "project_id,item_key" });
  }, [checked, projectId, supabase, toast]);

  const toggleSection = useCallback((key: string) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const toggleTooltip = useCallback((id: string) => {
    setTooltipOpen((prev) => (prev === id ? null : id));
  }, []);

  /* Shortcut verification state (binary: verified OK / found issue) */
  const [shortcutVerifications, setShortcutVerifications] = useState<Record<string, "verified" | "issue" | null>>({});

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase
          .from("ncc_checklist_items")
          .select("item_key, checked")
          .eq("project_id", projectId)
          .like("item_key", "shortcut-%");

        if (data && data.length > 0) {
          const map: Record<string, "verified" | "issue" | null> = {};
          for (const row of data) {
            // We store shortcut status as checked=true for "verified", checked=false for "issue"
            // and item_key has a suffix: shortcut-id:verified or shortcut-id:issue
            const parts = row.item_key.split(":");
            if (parts.length === 2) {
              map[parts[0]] = parts[1] as "verified" | "issue";
            }
          }
          setShortcutVerifications(map);
        }
      } catch { /* ignore */ }
    })();
  }, [projectId, supabase]);

  const toggleShortcutVerification = useCallback(async (id: string, status: "verified" | "issue") => {
    const currentStatus = shortcutVerifications[id];
    const newStatus = currentStatus === status ? null : status;
    setShortcutVerifications((prev) => ({ ...prev, [id]: newStatus }));

    if (newStatus === "verified") {
      toast("Marked as compliant", "success");
    } else if (newStatus === "issue") {
      toast("Non-compliance flagged", "error");
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (newStatus === null) {
      // Remove both possible entries
      await supabase.from("ncc_checklist_items").delete()
        .eq("project_id", projectId)
        .in("item_key", [`${id}:verified`, `${id}:issue`]);
    } else {
      // Remove old status entry if exists, then insert new
      const oldKey = `${id}:${currentStatus === "verified" ? "verified" : "issue"}`;
      await supabase.from("ncc_checklist_items").delete()
        .eq("project_id", projectId)
        .eq("item_key", oldKey);

      await supabase.from("ncc_checklist_items").upsert({
        project_id: projectId,
        user_id: user.id,
        item_key: `${id}:${newStatus}`,
        checked: true,
        checked_at: new Date().toISOString(),
      }, { onConflict: "project_id,item_key" });
    }
  }, [shortcutVerifications, projectId, supabase, toast]);

  /* Scoring helpers */
  const sectionScore = (section: ComplianceSection) => {
    const total = section.items.length;
    const done = section.items.filter((i) => checked[i.id]).length;
    return { done, total };
  };

  const allItems = SECTIONS.flatMap((s) => s.items);
  const totalItems = allItems.length;
  const totalChecked = allItems.filter((i) => checked[i.id]).length;
  const overallPercent =
    totalItems > 0 ? Math.round((totalChecked / totalItems) * 100) : 0;

  const stateNote = STATE_NOTES.find(
    (s) => s.code === stateCode.toUpperCase()
  );

  /* Bar colour */
  const barColour =
    overallPercent === 100
      ? "bg-green-500"
      : overallPercent >= 50
        ? "bg-amber-500"
        : "bg-red-500";

  if (!loaded) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* ---- Header ---- */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-start gap-3 mb-3">
          <ShieldIcon />
          <div>
            <h2 className="text-xl font-bold">
              NCC 2025 Compliance Tracker
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              The National Construction Code 2025 introduced major new
              requirements for energy efficiency, accessibility, and
              condensation management.{" "}
              <span className="font-semibold text-foreground">
                Your builder MUST comply
              </span>{" "}
              &mdash; non-compliance can void insurance, reduce resale value,
              and create serious livability problems.
            </p>
          </div>
        </div>

        {buildCategory === "new_build" && (
          <p className="text-xs text-muted-foreground ml-9">
            Build category: <span className="font-medium">New Build</span>{" "}
            &middot; State:{" "}
            <span className="font-medium">{stateCode.toUpperCase()}</span>
          </p>
        )}
      </div>

      {/* ---- Overall progress ---- */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">Overall Compliance</span>
          <span className="text-sm font-bold">
            {totalChecked}/{totalItems} verified ({overallPercent}%)
          </span>
        </div>
        <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${barColour}`}
            style={{ width: `${overallPercent}%` }}
          />
        </div>
      </div>

      {/* ---- Sections ---- */}
      {SECTIONS.map((section) => {
        const { done, total } = sectionScore(section);
        const isOpen = expanded[section.key];
        const sectionPercent =
          total > 0 ? Math.round((done / total) * 100) : 0;
        const sectionBarColour =
          sectionPercent === 100
            ? "bg-green-500"
            : sectionPercent > 0
              ? "bg-amber-500"
              : "bg-muted";

        return (
          <div
            key={section.key}
            className="bg-card border border-border rounded-xl overflow-hidden"
          >
            {/* Section header */}
            <button
              type="button"
              onClick={() => toggleSection(section.key)}
              aria-expanded={!!isOpen}
              aria-controls={`ncc-section-${section.key}`}
              className="w-full flex items-center justify-between gap-3 p-5 text-left hover:bg-muted/50 transition-colors focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-[-2px]"
            >
              <div className="flex items-center gap-3 min-w-0">
                <ChevronIcon open={!!isOpen} />
                <div className="min-w-0">
                  <h3 className="font-semibold text-sm leading-tight">
                    {section.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {section.description}
                  </p>
                </div>
              </div>
              <span
                className={`shrink-0 text-xs font-bold px-2.5 py-1 rounded-full ${
                  sectionPercent === 100
                    ? "bg-green-100 text-green-800"
                    : sectionPercent > 0
                      ? "bg-amber-100 text-amber-800"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {done}/{total}
              </span>
            </button>

            {/* Section progress bar */}
            <div className="px-5">
              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${sectionBarColour}`}
                  style={{ width: `${sectionPercent}%` }}
                />
              </div>
            </div>

            {/* Checklist items */}
            {isOpen && (
              <div id={`ncc-section-${section.key}`} role="region" aria-label={section.title} className="p-5 pt-4 space-y-2">
                {section.items.map((item) => {
                  const isChecked = !!checked[item.id];
                  const isTooltipOpen = tooltipOpen === item.id;

                  return (
                    <div key={item.id} className="space-y-1">
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          id={item.id}
                          checked={isChecked}
                          onChange={() => toggleItem(item.id)}
                          className="mt-0.5 h-5 w-5 min-h-[20px] min-w-[20px] rounded border-border accent-green-600 shrink-0 cursor-pointer"
                        />
                        <label
                          htmlFor={item.id}
                          className={`text-sm cursor-pointer select-none flex-1 ${
                            isChecked
                              ? "text-green-700 line-through"
                              : "text-foreground"
                          }`}
                        >
                          {item.label}
                        </label>
                        <button
                          type="button"
                          onClick={() => toggleTooltip(item.id)}
                          className="p-2 -m-2 hover:opacity-70 transition-opacity focus-visible:outline-2 focus-visible:outline-primary rounded"
                          aria-label={`More info about: ${item.label}`}
                          aria-expanded={isTooltipOpen}
                        >
                          <InfoIcon />
                        </button>
                      </div>
                      {isTooltipOpen && (
                        <div className="ml-7 mr-7 p-3 bg-muted/60 border border-border rounded-lg text-xs text-muted-foreground leading-relaxed">
                          {item.info}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* ---- Warning panel with binary actions ---- */}
      <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <WarningIcon />
          <h3 className="font-bold text-red-800 dark:text-red-400 text-sm">
            Common NCC 2025 Shortcuts Builders Take
          </h3>
        </div>
        <p className="text-xs text-red-700 dark:text-red-400">
          Check each item and mark whether your builder has complied.
        </p>
        <div className="space-y-3">
          {BUILDER_SHORTCUTS.map((shortcut) => {
            const status = shortcutVerifications[shortcut.id];
            return (
              <div
                key={shortcut.id}
                className={`p-3 rounded-lg border transition-colors ${
                  status === "verified"
                    ? "bg-green-50 dark:bg-green-950/30 border-green-300 dark:border-green-800"
                    : status === "issue"
                      ? "bg-red-100 dark:bg-red-950/40 border-red-400 dark:border-red-700"
                      : "bg-white/60 dark:bg-red-950/10 border-red-200 dark:border-red-800/50"
                }`}
              >
                <div className="flex items-start gap-2">
                  <span className="shrink-0 mt-0.5">
                    {status === "verified" ? (
                      <span className="text-green-600">{"\u2713"}</span>
                    ) : status === "issue" ? (
                      <span className="text-red-600">{"\u{1F6A9}"}</span>
                    ) : (
                      <span className="w-4 h-4 rounded-full bg-red-200 dark:bg-red-800 flex items-center justify-center text-red-700 dark:text-red-300 text-xs font-bold">
                        &#x2715;
                      </span>
                    )}
                  </span>
                  <span className={`text-sm flex-1 ${
                    status === "verified"
                      ? "text-green-800 dark:text-green-300 line-through opacity-70"
                      : "text-red-800 dark:text-red-300"
                  }`}>
                    {shortcut.text}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-2 ml-6">
                  <button
                    type="button"
                    onClick={() => toggleShortcutVerification(shortcut.id, "verified")}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-medium transition-colors min-h-[36px] ${
                      status === "verified"
                        ? "bg-green-600 text-white"
                        : "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 hover:bg-green-200"
                    }`}
                  >
                    {"\u2713"} OK
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleShortcutVerification(shortcut.id, "issue")}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-medium transition-colors min-h-[36px] ${
                      status === "issue"
                        ? "bg-red-600 text-white"
                        : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 hover:bg-red-200"
                    }`}
                  >
                    {"\u{1F6A9}"} Issue
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        {/* Summary */}
        {(() => {
          const verified = BUILDER_SHORTCUTS.filter(s => shortcutVerifications[s.id] === "verified").length;
          const issues = BUILDER_SHORTCUTS.filter(s => shortcutVerifications[s.id] === "issue").length;
          if (verified === 0 && issues === 0) return null;
          return (
            <div className="pt-2 border-t border-red-200/50 dark:border-red-800/50 flex items-center gap-3 text-xs">
              {verified > 0 && <span className="text-green-700 dark:text-green-400 font-medium">{verified} clear</span>}
              {issues > 0 && <span className="text-red-700 dark:text-red-400 font-medium">{issues} issue{issues !== 1 ? "s" : ""} found</span>}
              <span className="text-muted-foreground">{BUILDER_SHORTCUTS.length - verified - issues} unchecked</span>
            </div>
          );
        })()}
      </div>

      {/* ---- State-specific note ---- */}
      {stateNote && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold text-sm mb-1">
            {stateNote.code} &mdash; State-Specific Note
          </h3>
          <p className="text-sm text-muted-foreground">{stateNote.note}</p>
        </div>
      )}

      {/* ---- All states reference ---- */}
      <details className="bg-card border border-border rounded-xl overflow-hidden">
        <summary className="p-5 cursor-pointer text-sm font-semibold hover:bg-muted/50 transition-colors">
          View NCC 2025 Adoption Dates by State
        </summary>
        <div className="px-5 pb-5 space-y-2">
          {STATE_NOTES.map((sn) => (
            <div key={sn.code} className="text-sm">
              <span className="font-medium">{sn.code}:</span>{" "}
              <span className="text-muted-foreground">{sn.note}</span>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}
