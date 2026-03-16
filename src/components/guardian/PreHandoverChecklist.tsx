"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PreHandoverChecklistProps {
  projectId?: string;
  onDefectsCreated?: () => void;
}

type Severity = "critical" | "major" | "minor" | "cosmetic";

interface SnagItem {
  id: string;
  category: string;
  text: string;
  found: boolean;
  description: string;
  location: string;
  severity: Severity;
  photoNote: string;
  isCustom?: boolean;
}

// ---------------------------------------------------------------------------
// Default checklist data (Australian homes)
// ---------------------------------------------------------------------------

interface CategoryDef {
  category: string;
  items: { id: string; text: string }[];
}

const CHECKLIST_CATEGORIES: CategoryDef[] = [
  {
    category: "Interior \u2014 Walls, Ceilings, Floors",
    items: [
      { id: "int-walls-cracks", text: "Walls free of cracks, dents, or nail pops" },
      { id: "int-walls-paint", text: "Paint finish even with no runs, drips, or missed areas" },
      { id: "int-walls-corners", text: "Corners and edges straight and clean" },
      { id: "int-ceiling-flat", text: "Ceilings level, no sagging or water stains" },
      { id: "int-ceiling-cornice", text: "Cornice neatly joined with no gaps" },
      { id: "int-floors-level", text: "Floors level and free of squeaks" },
      { id: "int-floors-tiles", text: "Floor tiles laid evenly, no lippage or hollow sounds" },
      { id: "int-floors-carpet", text: "Carpet stretched tight with no bumps or loose edges" },
      { id: "int-floors-timber", text: "Timber/laminate floors free of scratches and gaps" },
      { id: "int-skirting", text: "Skirting boards straight, no gaps at floor or wall" },
    ],
  },
  {
    category: "Interior \u2014 Doors and Windows",
    items: [
      { id: "int-doors-open", text: "All doors open, close, and latch properly" },
      { id: "int-doors-handles", text: "Door handles and locks functioning correctly" },
      { id: "int-doors-gaps", text: "Even gap around door frames, no rubbing" },
      { id: "int-doors-stoppers", text: "Door stops installed on all doors" },
      { id: "int-windows-open", text: "All windows open, close, and lock properly" },
      { id: "int-windows-seals", text: "Window seals intact, no drafts" },
      { id: "int-windows-flyscreen", text: "Flyscreens fitted and undamaged" },
      { id: "int-windows-sills", text: "Window sills clean and free of defects" },
      { id: "int-joinery-shelves", text: "Built-in shelves, robes, and joinery secure" },
      { id: "int-joinery-drawers", text: "Drawers and cupboard doors aligned, soft-close working" },
    ],
  },
  {
    category: "Kitchen",
    items: [
      { id: "kit-bench-surface", text: "Benchtops free of chips, scratches, or stains" },
      { id: "kit-bench-joins", text: "Benchtop joins smooth and sealed" },
      { id: "kit-cabinets-doors", text: "Cabinet doors aligned and close properly" },
      { id: "kit-cabinets-drawers", text: "Drawers slide smoothly, soft-close engaged" },
      { id: "kit-cabinets-handles", text: "All handles and knobs secure" },
      { id: "kit-splash-tiles", text: "Splashback tiles/panel fitted neatly, no gaps" },
      { id: "kit-splash-grout", text: "Splashback grouting clean and even" },
      { id: "kit-sink-tap", text: "Sink taps function (hot/cold correct), no leaks" },
      { id: "kit-sink-drain", text: "Sink drains freely, no gurgling" },
      { id: "kit-appliances", text: "Oven, cooktop, rangehood, dishwasher all operational" },
      { id: "kit-plumbing-leaks", text: "No leaks under sink or behind dishwasher" },
    ],
  },
  {
    category: "Bathrooms and Laundry",
    items: [
      { id: "bath-tiles-cracks", text: "Tiles free of cracks, chips, or hollow spots" },
      { id: "bath-grout-even", text: "Grouting consistent, no gaps or discolouration" },
      { id: "bath-grout-silicone", text: "Silicone sealed around bath, shower, basin" },
      { id: "bath-waterproof", text: "No signs of water leaking behind tiles or under floor" },
      { id: "bath-taps-hot", text: "All taps deliver hot and cold correctly" },
      { id: "bath-taps-pressure", text: "Water pressure adequate in all fixtures" },
      { id: "bath-drains", text: "All drains flow freely with no pooling" },
      { id: "bath-shower-screen", text: "Shower screen sealed and stable" },
      { id: "bath-toilet", text: "Toilet flushes correctly, no running or leaks" },
      { id: "bath-exhaust", text: "Exhaust fan operational and vented externally" },
      { id: "bath-towel-rails", text: "Towel rails, toilet roll holders secure" },
      { id: "bath-laundry-tub", text: "Laundry tub and taps working, no leaks" },
    ],
  },
  {
    category: "Electrical",
    items: [
      { id: "elec-switches", text: "All light switches work correctly" },
      { id: "elec-dimmers", text: "Dimmer switches operate smoothly" },
      { id: "elec-powerpoints", text: "All power points operational (test with charger)" },
      { id: "elec-powerpoints-level", text: "Power points and switches level and flush" },
      { id: "elec-lights-int", text: "All interior lights working" },
      { id: "elec-lights-ext", text: "External lights and sensor lights working" },
      { id: "elec-downlights", text: "Downlights aligned and even spacing" },
      { id: "elec-smoke-alarms", text: "Smoke alarms installed and tested" },
      { id: "elec-rcd", text: "RCD/safety switch trips correctly (test button)" },
      { id: "elec-meter-box", text: "Meter box labelled and circuits identified" },
      { id: "elec-data-tv", text: "Data/TV/phone points in correct locations" },
    ],
  },
  {
    category: "External",
    items: [
      { id: "ext-render-cracks", text: "External render/cladding free of cracks" },
      { id: "ext-paint", text: "External paint finish even and complete" },
      { id: "ext-brickwork", text: "Brickwork mortar joints neat, weep holes clear" },
      { id: "ext-gutters", text: "Gutters straight, no sagging, securely fixed" },
      { id: "ext-downpipes", text: "Downpipes connected and directed away from house" },
      { id: "ext-driveway", text: "Driveway and paths free of cracks, properly graded" },
      { id: "ext-landscape", text: "Landscaping, turf, and garden beds as per plan" },
      { id: "ext-fencing", text: "Fencing straight, gates latch correctly" },
      { id: "ext-letterbox", text: "Letterbox installed and numbered" },
      { id: "ext-clothesline", text: "Clothesline installed (if applicable)" },
      { id: "ext-taps", text: "External taps working, no leaks" },
    ],
  },
  {
    category: "Compliance and Documentation",
    items: [
      { id: "comp-oc", text: "Occupation Certificate (OC) received from council" },
      { id: "comp-smoke", text: "Smoke alarms comply with AS 3786-2014" },
      { id: "comp-handrails", text: "Stair handrails and balustrades meet BCA height (1m)" },
      { id: "comp-pool-fence", text: "Pool fence compliant with AS 1926.1 (if applicable)" },
      { id: "comp-waterproof-cert", text: "Waterproofing certificate provided" },
      { id: "comp-termite", text: "Termite protection certificate provided" },
      { id: "comp-energy-cert", text: "Energy efficiency certificate / BASIX (if required)" },
      { id: "comp-warranties", text: "Appliance warranties and manuals handed over" },
      { id: "comp-defect-period", text: "Builder confirmed defect liability period (usually 6 months)" },
      { id: "comp-keys", text: "All keys, remotes, and codes provided" },
    ],
  },
];

// ---------------------------------------------------------------------------
// localStorage helpers
// ---------------------------------------------------------------------------

const STORAGE_KEY_PREFIX = "prehandover-checklist-";

function loadState(projectId: string): SnagItem[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PREFIX + projectId);
    if (!raw) return null;
    return JSON.parse(raw) as SnagItem[];
  } catch {
    return null;
  }
}

function saveState(projectId: string, items: SnagItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + projectId, JSON.stringify(items));
  } catch {
    // storage full — ignore
  }
}

function clearState(projectId: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY_PREFIX + projectId);
}

// ---------------------------------------------------------------------------
// Build default snag items from category definitions
// ---------------------------------------------------------------------------

function buildDefaultItems(): SnagItem[] {
  return CHECKLIST_CATEGORIES.flatMap((cat) =>
    cat.items.map((item) => ({
      id: item.id,
      category: cat.category,
      text: item.text,
      found: false,
      description: "",
      location: "",
      severity: "minor" as Severity,
      photoNote: "",
      isCustom: false,
    }))
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PreHandoverChecklist({
  projectId,
  onDefectsCreated,
}: PreHandoverChecklistProps) {
  const [items, setItems] = useState<SnagItem[]>([]);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [resultMsg, setResultMsg] = useState<string | null>(null);
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [customDraft, setCustomDraft] = useState({
    text: "",
    location: "",
    severity: "minor" as Severity,
    photoNote: "",
    category: CHECKLIST_CATEGORIES[0].category,
  });

  // Load from localStorage on mount (only if projectId is set)
  useEffect(() => {
    if (projectId) {
      const saved = loadState(projectId);
      if (saved && saved.length > 0) {
        const defaults = buildDefaultItems();
        const savedIds = new Set(saved.map((s) => s.id));
        const merged = [
          ...saved,
          ...defaults.filter((d) => !savedIds.has(d.id)),
        ];
        setItems(merged);
      } else {
        setItems(buildDefaultItems());
      }
    } else {
      setItems(buildDefaultItems());
    }
  }, [projectId]);

  // Persist to localStorage on every change (only if projectId is set)
  const persist = useCallback(
    (updated: SnagItem[]) => {
      setItems(updated);
      if (projectId) saveState(projectId, updated);
    },
    [projectId]
  );

  // ---- Derived values ----
  const categories = Array.from(new Set(items.map((i) => i.category)));
  const totalItems = items.length;
  const foundItems = items.filter((i) => i.found);
  const foundCount = foundItems.length;
  const checkedCount = items.filter((i) => i.found || i.description).length;

  // ---- Handlers ----

  const toggleFound = (id: string) => {
    const updated = items.map((i) =>
      i.id === id ? { ...i, found: !i.found } : i
    );
    persist(updated);
  };

  const updateSnagDetails = (
    id: string,
    field: "description" | "location" | "severity" | "photoNote",
    value: string
  ) => {
    const updated = items.map((i) =>
      i.id === id ? { ...i, [field]: value } : i
    );
    persist(updated);
  };

  const clearAll = () => {
    if (projectId) clearState(projectId);
    setItems(buildDefaultItems());
    setEditingItemId(null);
    setResultMsg(null);
  };

  const addCustomItem = () => {
    if (!customDraft.text.trim()) return;
    const newItem: SnagItem = {
      id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      category: customDraft.category,
      text: customDraft.text.trim(),
      found: true,
      description: customDraft.text.trim(),
      location: customDraft.location.trim(),
      severity: customDraft.severity,
      photoNote: customDraft.photoNote.trim(),
      isCustom: true,
    };
    persist([...items, newItem]);
    setCustomDraft({
      text: "",
      location: "",
      severity: "minor",
      photoNote: "",
      category: CHECKLIST_CATEGORIES[0].category,
    });
    setShowAddCustom(false);
  };

  const removeCustomItem = (id: string) => {
    persist(items.filter((i) => i.id !== id));
  };

  // ---- Bridge: Create Defects ----

  const createDefects = async () => {
    const snags = items.filter((i) => i.found && i.description.trim());
    if (snags.length === 0) return;

    setCreating(true);
    setResultMsg(null);

    try {
      const supabase = createClient();
      const rows = snags.map((s) => ({
        project_id: projectId,
        title: s.text,
        description: s.description,
        location: s.location || s.category,
        stage: "practical_completion",
        severity: s.severity,
        status: "open" as const,
        image_url: s.photoNote || null,
      }));

      const { data, error } = await supabase
        .from("defects")
        .insert(rows)
        .select("id");

      if (error) throw error;

      const count = data?.length ?? snags.length;
      setResultMsg(
        `${count} defect${count === 1 ? "" : "s"} created successfully.`
      );
      onDefectsCreated?.();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Unknown error creating defects";
      setResultMsg("Error: " + message);
    } finally {
      setCreating(false);
    }
  };

  // ---- Download snag list (text) ----

  const downloadSnagList = () => {
    const snags = items.filter((i) => i.found);
    let report = "PRE-HANDOVER INSPECTION - SNAGGING LIST\n";
    report += "=".repeat(50) + "\n";
    report += `Generated: ${new Date().toLocaleDateString("en-AU")}\n`;
    report += `Items inspected: ${checkedCount}/${totalItems}\n`;
    report += `Snags found: ${snags.length}\n\n`;

    if (snags.length > 0) {
      report += "DEFECTS / ISSUES IDENTIFIED\n";
      report += "-".repeat(50) + "\n\n";
      snags.forEach((s, idx) => {
        report += `${idx + 1}. [${s.severity.toUpperCase()}] ${s.text}\n`;
        if (s.description) report += `   Description: ${s.description}\n`;
        if (s.location) report += `   Location: ${s.location}\n`;
        if (s.photoNote) report += `   Photo note: ${s.photoNote}\n`;
        report += "\n";
      });
    }

    report += "\nNOTES FOR BUILDER:\n";
    report +=
      "All above items require rectification before final handover.\n";

    const blob = new Blob([report], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `snagging_list_${new Date().toISOString().split("T")[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ---- Severity helpers ----

  const severityColor = (s: Severity): string => {
    switch (s) {
      case "critical":
        return "text-red-700";
      case "major":
        return "text-orange-700";
      case "minor":
        return "text-yellow-700";
      case "cosmetic":
        return "text-blue-700";
    }
  };

  const severityBg = (s: Severity): string => {
    switch (s) {
      case "critical":
        return "bg-red-100 text-red-800";
      case "major":
        return "bg-orange-100 text-orange-800";
      case "minor":
        return "bg-yellow-100 text-yellow-800";
      case "cosmetic":
        return "bg-blue-100 text-blue-800";
    }
  };

  // ---- Render ----

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">
            Pre-Handover Inspection
          </h2>
          <p className="text-muted-foreground">
            {totalItems}-point checklist for your final walkthrough before
            settlement.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-2xl font-bold">
              {Math.round((checkedCount / totalItems) * 100)}%
            </div>
            <div className="text-sm text-muted-foreground">
              {checkedCount}/{totalItems} inspected
            </div>
          </div>
          {foundCount > 0 && (
            <span className="inline-flex items-center justify-center px-3 py-1 text-sm font-semibold rounded-full bg-red-100 text-red-800">
              {foundCount} snag{foundCount === 1 ? "" : "s"} found
            </span>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full transition-all ${
            checkedCount === totalItems ? "bg-green-500" : "bg-primary"
          }`}
          style={{
            width: `${Math.round((checkedCount / totalItems) * 100)}%`,
          }}
        />
      </div>

      {/* Snag summary */}
      {foundCount > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl dark:bg-amber-950/30 dark:border-amber-800">
          <h3 className="font-bold text-amber-800 dark:text-amber-300 mb-2">
            {foundCount} Snag{foundCount === 1 ? "" : "s"} Found
          </h3>
          <div className="flex flex-wrap gap-4 text-sm">
            <span className="text-red-700 dark:text-red-400">
              Critical:{" "}
              {items.filter((i) => i.found && i.severity === "critical").length}
            </span>
            <span className="text-orange-700 dark:text-orange-400">
              Major:{" "}
              {items.filter((i) => i.found && i.severity === "major").length}
            </span>
            <span className="text-yellow-700 dark:text-yellow-400">
              Minor:{" "}
              {items.filter((i) => i.found && i.severity === "minor").length}
            </span>
            <span className="text-blue-700 dark:text-blue-400">
              Cosmetic:{" "}
              {items.filter((i) => i.found && i.severity === "cosmetic").length}
            </span>
          </div>
        </div>
      )}

      {/* Action buttons row */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setShowAddCustom((v) => !v)}
          className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
        >
          + Add Custom Snag
        </button>

        {foundCount > 0 && (
          <button
            onClick={downloadSnagList}
            className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted/20 transition-colors"
          >
            Download Snag List
          </button>
        )}

        <button
          onClick={clearAll}
          className="px-4 py-2 border border-border rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
        >
          Clear All
        </button>
      </div>

      {/* Add custom snag form */}
      {showAddCustom && (
        <div className="p-4 border border-border rounded-xl bg-card space-y-3">
          <h4 className="font-semibold">Add Custom Snag Item</h4>
          <input
            type="text"
            value={customDraft.text}
            onChange={(e) =>
              setCustomDraft({ ...customDraft, text: e.target.value })
            }
            placeholder="Describe the snag..."
            className="w-full px-3 py-2 border border-border rounded-lg bg-background"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              value={customDraft.location}
              onChange={(e) =>
                setCustomDraft({ ...customDraft, location: e.target.value })
              }
              placeholder="Location (room / area)"
              className="px-3 py-2 border border-border rounded-lg bg-background"
            />
            <select
              value={customDraft.severity}
              onChange={(e) =>
                setCustomDraft({
                  ...customDraft,
                  severity: e.target.value as Severity,
                })
              }
              className="px-3 py-2 border border-border rounded-lg bg-background"
            >
              <option value="cosmetic">Cosmetic</option>
              <option value="minor">Minor</option>
              <option value="major">Major</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select
              value={customDraft.category}
              onChange={(e) =>
                setCustomDraft({ ...customDraft, category: e.target.value })
              }
              className="px-3 py-2 border border-border rounded-lg bg-background"
            >
              {CHECKLIST_CATEGORIES.map((c) => (
                <option key={c.category} value={c.category}>
                  {c.category}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={customDraft.photoNote}
              onChange={(e) =>
                setCustomDraft({ ...customDraft, photoNote: e.target.value })
              }
              placeholder="Photo note (optional)"
              className="px-3 py-2 border border-border rounded-lg bg-background"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={addCustomItem}
              disabled={!customDraft.text.trim()}
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium disabled:opacity-50"
            >
              Add Snag
            </button>
            <button
              onClick={() => setShowAddCustom(false)}
              className="px-4 py-2 border border-border rounded-lg text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Categories */}
      <div className="space-y-3">
        {categories.map((catName) => {
          const catItems = items.filter((i) => i.category === catName);
          const catFound = catItems.filter((i) => i.found).length;
          const isExpanded = expandedCategory === catName;

          return (
            <div
              key={catName}
              className="border border-border rounded-xl overflow-hidden"
            >
              <button
                onClick={() =>
                  setExpandedCategory(isExpanded ? null : catName)
                }
                className="w-full p-4 flex items-center justify-between bg-card hover:bg-muted/10 transition-colors text-left"
              >
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-bold">{catName}</span>
                  <span className="text-sm text-muted-foreground">
                    ({catItems.filter((i) => i.found || i.description).length}/
                    {catItems.length})
                  </span>
                  {catFound > 0 && (
                    <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-medium">
                      {catFound} snag{catFound === 1 ? "" : "s"}
                    </span>
                  )}
                </div>
                <span className="text-muted-foreground">
                  {isExpanded ? "\u25B2" : "\u25BC"}
                </span>
              </button>

              {isExpanded && (
                <div className="p-4 pt-2 space-y-2">
                  {catItems.map((item) => {
                    const isEditing = editingItemId === item.id;

                    return (
                      <div
                        key={item.id}
                        className={`p-3 rounded-lg transition-colors ${
                          item.found
                            ? "bg-red-50 dark:bg-red-950/20"
                            : "bg-muted/10"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={item.found}
                            onChange={() => toggleFound(item.id)}
                            className="w-5 h-5 mt-0.5 accent-red-600"
                            title="Mark as snag found"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <span
                                className={
                                  !item.found
                                    ? ""
                                    : "font-medium"
                                }
                              >
                                {item.text}
                              </span>
                              {item.isCustom && (
                                <button
                                  onClick={() => removeCustomItem(item.id)}
                                  className="text-xs text-red-500 hover:underline shrink-0"
                                  title="Remove custom item"
                                >
                                  Remove
                                </button>
                              )}
                            </div>

                            {/* Severity badge when found */}
                            {item.found && (
                              <span
                                className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full font-medium ${severityBg(
                                  item.severity
                                )}`}
                              >
                                {item.severity.toUpperCase()}
                              </span>
                            )}

                            {/* Snag detail summary */}
                            {item.found && item.description && !isEditing && (
                              <div className="mt-2 text-sm text-muted-foreground space-y-0.5">
                                <div>
                                  <span className="font-medium">Issue:</span>{" "}
                                  {item.description}
                                </div>
                                {item.location && (
                                  <div>
                                    <span className="font-medium">
                                      Location:
                                    </span>{" "}
                                    {item.location}
                                  </div>
                                )}
                                {item.photoNote && (
                                  <div>
                                    <span className="font-medium">
                                      Photo note:
                                    </span>{" "}
                                    {item.photoNote}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Edit / Add Details button */}
                            {item.found && !isEditing && (
                              <button
                                onClick={() => setEditingItemId(item.id)}
                                className="mt-2 text-xs text-primary hover:underline"
                              >
                                {item.description
                                  ? "Edit details"
                                  : "+ Add details"}
                              </button>
                            )}

                            {/* Inline detail form */}
                            {item.found && isEditing && (
                              <div className="mt-3 p-3 bg-card border border-border rounded-lg space-y-2">
                                <input
                                  type="text"
                                  value={item.description}
                                  onChange={(e) =>
                                    updateSnagDetails(
                                      item.id,
                                      "description",
                                      e.target.value
                                    )
                                  }
                                  placeholder="Describe the issue..."
                                  className="w-full px-3 py-2 border border-border rounded bg-background text-sm"
                                />
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                  <input
                                    type="text"
                                    value={item.location}
                                    onChange={(e) =>
                                      updateSnagDetails(
                                        item.id,
                                        "location",
                                        e.target.value
                                      )
                                    }
                                    placeholder="Location (room/area)"
                                    className="px-3 py-2 border border-border rounded bg-background text-sm"
                                  />
                                  <select
                                    value={item.severity}
                                    onChange={(e) =>
                                      updateSnagDetails(
                                        item.id,
                                        "severity",
                                        e.target.value
                                      )
                                    }
                                    className="px-3 py-2 border border-border rounded bg-background text-sm"
                                  >
                                    <option value="cosmetic">Cosmetic</option>
                                    <option value="minor">Minor</option>
                                    <option value="major">Major</option>
                                    <option value="critical">Critical</option>
                                  </select>
                                  <input
                                    type="text"
                                    value={item.photoNote}
                                    onChange={(e) =>
                                      updateSnagDetails(
                                        item.id,
                                        "photoNote",
                                        e.target.value
                                      )
                                    }
                                    placeholder="Photo note (optional)"
                                    className="px-3 py-2 border border-border rounded bg-background text-sm"
                                  />
                                </div>
                                <button
                                  onClick={() => setEditingItemId(null)}
                                  className="px-3 py-1.5 bg-primary text-white rounded text-sm font-medium"
                                >
                                  Done
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bridge: Create Defects */}
      {foundCount > 0 && (
        <div className="p-5 border-2 border-primary/30 rounded-xl bg-primary/5 space-y-3">
          <h3 className="font-bold text-lg">Create Defects from Snag List</h3>
          <p className="text-sm text-muted-foreground">
            Convert {foundCount} found snag{foundCount === 1 ? "" : "s"} into
            formal defect records. Items without a description will be created
            using the checklist item text. All defects will be tagged as{" "}
            <span className="font-mono text-xs bg-muted px-1 py-0.5 rounded">
              practical_completion
            </span>{" "}
            stage with{" "}
            <span className="font-mono text-xs bg-muted px-1 py-0.5 rounded">
              open
            </span>{" "}
            status.
          </p>

          {resultMsg && (
            <div
              className={`p-3 rounded-lg text-sm font-medium ${
                resultMsg.startsWith("Error")
                  ? "bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-400"
                  : "bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-400"
              }`}
            >
              {resultMsg}
            </div>
          )}

          <button
            onClick={createDefects}
            disabled={creating}
            className="px-6 py-3 bg-primary text-white rounded-lg font-semibold disabled:opacity-50 hover:opacity-90 transition-opacity"
          >
            {creating
              ? "Creating defects..."
              : `Create ${foundCount} Defect${foundCount === 1 ? "" : "s"}`}
          </button>
        </div>
      )}
    </div>
  );
}
