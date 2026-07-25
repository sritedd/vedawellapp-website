"use client";

/* ==================================================================
 * MIGRAINE TRACKER  ·  /tools/migraine-tracker
 *
 * A patient-kept observation record. Obs-chart aesthetic: monospace field
 * labels, a plotted severity trace, values that line up in columns.
 *
 * Theme follows the site (light "day" / dark "dim"), with a manual DIM
 * override for logging mid-attack when light is the enemy.
 *
 * Storage is layered by src/lib/tools/migraine-sync:
 *   localStorage (always) → Supabase profile (signed in) → Google Drive file.
 * ================================================================== */

import { useState, useMemo, useRef, useEffect, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import { useTheme } from "@/components/ThemeProvider";
import {
  useMigraineSync, type MigraineEntry, type MigraineLog, type SyncState,
} from "@/lib/tools/migraine-sync";

/* ------------------------------------------------------------------ *
 * Theme tokens
 * ------------------------------------------------------------------ */
const THEMES: Record<"day" | "dim", Record<string, string>> = {
  day: {
    "--paper": "#E9EDE8", "--card": "#F3F6F2", "--ink": "#1B211D", "--muted": "#63706A",
    "--faint": "#94A099", "--rule": "#C7D0C7", "--grid": "#D9E1D9", "--pen": "#2E4B6B", "--flag": "#8A5A2B",
  },
  dim: {
    "--paper": "#0C110E", "--card": "#141B16", "--ink": "#C8D6C9", "--muted": "#7A8A7C",
    "--faint": "#55655A", "--rule": "#273129", "--grid": "#1C251E", "--pen": "#7FA9C4", "--flag": "#C39A5E",
  },
};

const SEV = ["#7A9A80", "#86A077", "#93A56E", "#A2A566", "#B0A05E",
             "#B89257", "#B87F52", "#AE6A4E", "#9E544C", "#8A4048"];
const sevColor = (n: number) => (n >= 1 && n <= 10 ? SEV[n - 1] : "var(--rule)");
const sevText = (n: number) => (n >= 8 ? "#F2ECE8" : "#141A15");

const MONO = 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace';
const SANS = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
const DIM_KEY = "migraine-record:dim"; // manual theme override, "day" | "dim" | "" (follow site)

/* Vocabulary */
const SYMPTOMS = ["Nausea", "Vomiting", "Light sensitivity", "Sound sensitivity",
  "Smell sensitivity", "Visual aura", "Tingling / numbness", "Neck pain",
  "Dizziness", "Brain fog", "Blurred vision"];
const TRIGGERS = ["Poor sleep", "Slept in", "Stress", "Stress let-down", "Skipped meal",
  "Dehydration", "Heat", "Humidity", "Weather change", "Bright light", "Screen time",
  "Strong smells", "Alcohol", "Caffeine", "Missed caffeine", "Exercise", "Neck / posture",
  "Travel", "Unknown"];
const QUICK_MEDS = ["Paracetamol", "Ibuprofen", "Aspirin", "Naproxen", "Sumatriptan",
  "Rizatriptan", "Eletriptan", "Anti-nausea", "None"];
const IMPACT = [
  { key: "carried on", label: "Carried on normally" },
  { key: "reduced", label: "Worked, but at half speed" },
  { key: "lay down", label: "Had to lie down" },
  { key: "day lost", label: "Lost the day entirely" },
];
const SIDES = ["Left", "Right", "Both", "Back / neck"];
const HELPED = ["Yes", "Partly", "No"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/* Helpers */
const pad = (n: number) => String(n).padStart(2, "0");
const todayISO = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const nowHM = () => { const d = new Date(); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

const fmtDate = (iso: string) => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${pad(Number(d))} ${MONTHS[Number(m) - 1]} ${y}`;
};
const durationHours = (e: MigraineEntry): number | null => {
  if (!e.startTime || !e.endTime || e.ongoing) return null;
  const [sh, sm] = e.startTime.split(":").map(Number);
  const [eh, em] = e.endTime.split(":").map(Number);
  let mins = (eh * 60 + em) - (sh * 60 + sm);
  if (mins < 0) mins += 24 * 60;
  return Math.round((mins / 60) * 10) / 10;
};
const daysAgo = (iso: string) => {
  if (!iso) return Infinity;
  const then = new Date(iso + "T00:00:00");
  const now = new Date(todayISO() + "T00:00:00");
  return Math.round((now.getTime() - then.getTime()) / 86400000);
};
const emptyEntry = (): MigraineEntry => ({
  id: uid(), date: todayISO(), startTime: nowHM(), endTime: "", ongoing: true,
  severity: 0, side: "", symptoms: [], triggers: [], meds: "", medHelped: "",
  impact: "", notes: "",
});

async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch { /* fall through */ }
  try {
    const ta = document.createElement("textarea");
    ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch { return false; }
}

/* ------------------------------------------------------------------ *
 * Styles + presentational pieces (module scope so they keep identity)
 * ------------------------------------------------------------------ */
const S: Record<string, CSSProperties> = {
  page: { background: "var(--paper)", color: "var(--ink)", fontFamily: SANS, minHeight: "100vh", display: "flex", flexDirection: "column" },
  body: { flex: 1, overflowY: "auto", padding: "16px 14px 92px", WebkitOverflowScrolling: "touch" } as CSSProperties,
  legend: { fontFamily: MONO, fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--muted)", paddingBottom: 6, marginBottom: 10, borderBottom: "1px solid var(--rule)", display: "flex", justifyContent: "space-between", alignItems: "baseline" },
  block: { background: "var(--card)", border: "1px solid var(--rule)", borderRadius: 2, padding: 13, marginBottom: 10 },
  label: { fontFamily: MONO, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 9, display: "block" },
  input: { width: "100%", background: "var(--paper)", border: "1px solid var(--rule)", color: "var(--ink)", borderRadius: 2, padding: "10px 11px", fontSize: 16, fontFamily: SANS, outline: "none", boxSizing: "border-box" },
  note: { fontSize: 12.5, color: "var(--muted)", lineHeight: 1.55, marginTop: 9 },
};

const Tag = ({ on, onClick, children, wide }: { on: boolean; onClick: () => void; children: ReactNode; wide?: boolean }) => (
  <button onClick={onClick} className="mr-t" style={{
    background: on ? "var(--ink)" : "transparent",
    border: `1px solid ${on ? "var(--ink)" : "var(--rule)"}`,
    color: on ? "var(--paper)" : "var(--muted)",
    borderRadius: 2, padding: "8px 11px", fontSize: 13.5, fontFamily: SANS,
    cursor: "pointer", lineHeight: 1.25, textAlign: "left",
    width: wide ? "100%" : "auto", fontWeight: on ? 600 : 400,
  }}>{children}</button>
);

const Row = ({ children }: { children: ReactNode }) => (
  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{children}</div>
);

const Stat = ({ value, unit, label, tint }: { value: ReactNode; unit: string; label: string; tint?: string }) => (
  <div style={{ ...S.block, marginBottom: 0, padding: "13px 12px" }}>
    <div style={{ fontFamily: MONO, fontSize: 27, lineHeight: 1, color: tint || "var(--ink)", fontWeight: 500 }}>
      {value}<span style={{ fontSize: 12, color: "var(--faint)", marginLeft: 3 }}>{unit}</span>
    </div>
    <div style={{ fontFamily: MONO, fontSize: 9.5, color: "var(--muted)", letterSpacing: "0.12em", textTransform: "uppercase", marginTop: 9, lineHeight: 1.45 }}>{label}</div>
  </div>
);

const Action = ({ onClick, title, sub, primary, disabled }: { onClick: () => void; title: string; sub: string; primary?: boolean; disabled?: boolean }) => (
  <button onClick={onClick} disabled={disabled} className="mr-t" style={{
    width: "100%", textAlign: "left", background: primary ? "var(--pen)" : "var(--card)",
    color: primary ? "#FFFFFF" : "var(--ink)",
    border: `1px solid ${primary ? "var(--pen)" : "var(--rule)"}`,
    borderRadius: 2, padding: "13px 14px", marginBottom: 8, cursor: disabled ? "default" : "pointer",
    fontFamily: SANS, opacity: disabled ? 0.55 : 1,
  }}>
    <div style={{ fontSize: 14.5, fontWeight: 600 }}>{title}</div>
    <div style={{ fontSize: 12.5, marginTop: 3, lineHeight: 1.45, color: primary ? "rgba(255,255,255,0.78)" : "var(--muted)" }}>{sub}</div>
  </button>
);

/* The observation trace: discrete readings as stems + dots over a severity
 * graticule, with a paired medication-day row beneath. */
const Trace = ({ year, month, peaks, medDays }: { year: number; month: number; peaks: Record<string, number>; medDays: Set<string> }) => {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const W = 320, padL = 20, padR = 6;
  const plotW = W - padL - padR;
  const top = 10, plotH = 88, base = top + plotH;
  const x = (d: number) => padL + ((d - 1) / Math.max(daysInMonth - 1, 1)) * plotW;
  const y = (s: number) => base - (s / 10) * plotH;
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const present = days.filter((d) => peaks[`${year}-${pad(month + 1)}-${pad(d)}`]);
  const ruleP = { stroke: "var(--grid)" }, baseP = { stroke: "var(--rule)" };
  const penP = { stroke: "var(--pen)" }, faintP = { fill: "var(--faint)" };

  return (
    <svg viewBox={`0 0 ${W} 150`} width="100%" role="img"
      aria-label={`Severity by day for ${MONTHS[month]} ${year}`}
      style={{ display: "block", overflow: "visible" }}>
      {[2, 4, 6, 8, 10].map((s) => (
        <g key={s}>
          <line x1={padL} x2={W - padR} y1={y(s)} y2={y(s)} style={ruleP} strokeWidth="1" />
          <text x={padL - 5} y={y(s) + 3} textAnchor="end" fontFamily={MONO} fontSize="8" style={faintP}>{s}</text>
        </g>
      ))}
      <line x1={padL} x2={W - padR} y1={base} y2={base} style={baseP} strokeWidth="1" />
      {present.map((d) => {
        const s = peaks[`${year}-${pad(month + 1)}-${pad(d)}`];
        return (
          <g key={d}>
            <line x1={x(d)} x2={x(d)} y1={base} y2={y(s)} style={{ stroke: sevColor(s) }} strokeWidth="1.5" />
            <circle cx={x(d)} cy={y(s)} r="3.2" style={{ fill: sevColor(s) }} />
          </g>
        );
      })}
      <text x={padL - 5} y={base + 20} textAnchor="end" fontFamily={MONO} fontSize="8" style={faintP}>RX</text>
      <line x1={padL} x2={W - padR} y1={base + 24} y2={base + 24} style={ruleP} strokeWidth="1" />
      {days.filter((d) => medDays.has(`${year}-${pad(month + 1)}-${pad(d)}`)).map((d) => (
        <line key={d} x1={x(d)} x2={x(d)} y1={base + 12} y2={base + 24} style={penP} strokeWidth="2" />
      ))}
      {days.filter((d) => d === 1 || d % 7 === 0).map((d) => (
        <text key={d} x={x(d)} y={base + 40} textAnchor="middle" fontFamily={MONO} fontSize="8" style={faintP}>{d}</text>
      ))}
      {present.length === 0 && (
        <text x={W / 2} y={base - 38} textAnchor="middle" fontFamily={SANS} fontSize="11" style={faintP}>
          No attacks recorded this month
        </text>
      )}
    </svg>
  );
};

const SYNC_LABEL: Record<SyncState, string> = {
  idle: "", loading: "SYNCING", saving: "SAVING", saved: "SYNCED", error: "SYNC ERROR",
};

/* ================================================================== */
export default function MigraineTrackerPage() {
  const { resolved } = useTheme();
  const {
    signedIn, user, log, setLog, loaded, syncState, connectDrive, pushToDrive,
  } = useMigraineSync();

  // Manual DIM override: "" follows the site theme; "day"/"dim" pin it.
  const [override, setOverride] = useState<"" | "day" | "dim">("");
  useEffect(() => {
    try {
      const v = window.localStorage.getItem(DIM_KEY);
      if (v === "day" || v === "dim") setOverride(v);
    } catch { /* ignore */ }
  }, []);
  const theme: "day" | "dim" = override || (resolved === "dark" ? "dim" : "day");
  const setThemeOverride = (v: "" | "day" | "dim") => {
    setOverride(v);
    try { v ? window.localStorage.setItem(DIM_KEY, v) : window.localStorage.removeItem(DIM_KEY); } catch { /* ignore */ }
  };

  const entries = log.entries;
  const preventive = log.preventive;
  const lastExport = log.lastExport;
  const setEntries = (u: MigraineEntry[] | ((p: MigraineEntry[]) => MigraineEntry[])) =>
    setLog((prev) => ({ ...prev, entries: typeof u === "function" ? u(prev.entries) : u }));
  const setPreventive = (v: string) => setLog((prev) => ({ ...prev, preventive: v }));
  const markExported = () => setLog((prev) => ({ ...prev, lastExport: todayISO() }));

  const [tab, setTab] = useState("log");
  const [draft, setDraft] = useState<MigraineEntry>(emptyEntry);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const [monthCursor, setMonthCursor] = useState(() => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() }; });
  const [window_, setWindow_] = useState(90);
  const [restoreText, setRestoreText] = useState("");
  const [showRaw, setShowRaw] = useState<string | null>(null);
  const [driveBusy, setDriveBusy] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flash = (msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2800);
  };

  /* ---- derived ---- */
  const peaks = useMemo(() => {
    const map: Record<string, number> = {};
    entries.forEach((e) => { if (e.date) map[e.date] = Math.max(map[e.date] || 0, e.severity || 0); });
    return map;
  }, [entries]);

  const allMedDays = useMemo(() => new Set(
    entries.filter((e) => e.meds && e.meds !== "None").map((e) => e.date)
  ), [entries]);

  const stats = useMemo(() => {
    const cut = entries.filter((e) => window_ === 0 || daysAgo(e.date) <= window_);
    const days = new Set(cut.map((e) => e.date));
    const medDays = new Set(cut.filter((e) => e.meds && e.meds !== "None").map((e) => e.date));
    const sevs = cut.map((e) => e.severity).filter(Boolean);
    const durs = cut.map(durationHours).filter((h): h is number => h != null);
    const auraCount = cut.filter((e) => e.symptoms.includes("Visual aura") || e.symptoms.includes("Tingling / numbness")).length;
    const lostDays = new Set(cut.filter((e) => e.impact === "day lost" || e.impact === "lay down").map((e) => e.date));
    const trigCount: Record<string, number> = {};
    cut.forEach((e) => e.triggers.forEach((t) => { trigCount[t] = (trigCount[t] || 0) + 1; }));
    const topTriggers = Object.entries(trigCount).sort((a, b) => b[1] - a[1]).slice(0, 6);
    const byMonth: Record<string, Set<string>> = {};
    cut.forEach((e) => { const k = e.date.slice(0, 7); (byMonth[k] = byMonth[k] || new Set()).add(e.date); });
    const monthly = Object.entries(byMonth).map(([k, v]) => [k, v.size] as [string, number]).sort();
    let spanDays = window_;
    if (!spanDays) {
      const oldest = cut.reduce((min, e) => (!min || e.date < min ? e.date : min), "");
      spanDays = oldest ? Math.max(daysAgo(oldest) + 1, 1) : 30;
    }
    const months = Math.max(1, spanDays / 30.44);
    return {
      attacks: cut.length, headacheDays: days.size,
      perMonth: Math.round((days.size / months) * 10) / 10,
      medDays: medDays.size, medPerMonth: Math.round((medDays.size / months) * 10) / 10,
      avgSev: sevs.length ? Math.round((sevs.reduce((a, b) => a + b, 0) / sevs.length) * 10) / 10 : 0,
      avgDur: durs.length ? Math.round((durs.reduce((a, b) => a + b, 0) / durs.length) * 10) / 10 : 0,
      auraCount, lostDays: lostDays.size, topTriggers, monthly,
    };
  }, [entries, window_]);

  const csv = useMemo(() => {
    const esc = (v: unknown) => { const s = String(v ?? ""); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
    const head = ["Date", "Start", "End", "Duration (h)", "Severity", "Location", "Symptoms", "Triggers", "Medication", "Medication helped", "Impact", "Notes"];
    const rows = [...entries].sort((a, b) => a.date.localeCompare(b.date)).map((e) => [
      e.date, e.startTime, e.ongoing ? "ongoing" : e.endTime, durationHours(e) ?? "",
      e.severity, e.side, e.symptoms.join("; "), e.triggers.join("; "),
      e.meds, e.medHelped, IMPACT.find((i) => i.key === e.impact)?.label || "", e.notes,
    ].map(esc).join(","));
    return [head.join(","), ...rows].join("\n");
  }, [entries]);

  const summary = useMemo(() => {
    const L: string[] = [];
    L.push("MIGRAINE OBSERVATION RECORD");
    L.push(`Prepared ${fmtDate(todayISO())}  ·  Period: ${window_ ? `last ${window_} days` : "all records"}`);
    L.push("");
    L.push(`Headache days            ${stats.headacheDays}   (${stats.perMonth} per month)`);
    L.push(`Attacks recorded         ${stats.attacks}`);
    L.push(`Acute medication days    ${stats.medDays}   (${stats.medPerMonth} per month)`);
    L.push(`Average severity         ${stats.avgSev || "—"} / 10`);
    L.push(`Average attack length    ${stats.avgDur ? stats.avgDur + " h" : "—"}`);
    L.push(`Attacks with aura        ${stats.auraCount}`);
    L.push(`Days unable to function  ${stats.lostDays}`);
    if (preventive) { L.push(""); L.push(`Preventive in use: ${preventive}`); }
    if (stats.topTriggers.length) {
      L.push(""); L.push("MOST FREQUENT TRIGGERS");
      stats.topTriggers.forEach(([t, n]) => L.push(`  ${t.padEnd(20)} ${n}`));
    }
    if (stats.monthly.length) {
      L.push(""); L.push("HEADACHE DAYS BY MONTH");
      stats.monthly.forEach(([k, n]) => L.push(`  ${k}   ${n}`));
    }
    L.push(""); L.push("Full attack-by-attack record attached as CSV.");
    return L.join("\n");
  }, [stats, preventive, window_]);

  /* ---- actions ---- */
  const saveDraft = () => {
    if (!draft.severity) { flash("Set a severity first"); return; }
    setEntries((prev) => {
      const next = editingId ? prev.map((e) => (e.id === editingId ? draft : e)) : [...prev, draft];
      return next.sort((a, b) => (b.date + b.startTime).localeCompare(a.date + a.startTime));
    });
    flash(editingId ? "Attack updated" : "Attack recorded");
    setDraft(emptyEntry());
    setEditingId(null);
    setTab("record");
  };
  const editEntry = (e: MigraineEntry) => { setDraft({ ...e }); setEditingId(e.id); setTab("log"); };
  const deleteEntry = (id: string) => { setEntries((p) => p.filter((e) => e.id !== id)); flash("Deleted"); };
  const toggle = (field: "symptoms" | "triggers", val: string) => setDraft((d) => ({
    ...d, [field]: d[field].includes(val) ? d[field].filter((x) => x !== val) : [...d[field], val],
  }));

  const doCopy = async (text: string, what: string) => {
    const ok = await copyText(text);
    if (ok) { flash(`${what} copied`); markExported(); }
    else { setShowRaw(text); flash("Copy blocked here — select the text below"); }
  };
  const doDownload = () => {
    try {
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `migraine-record-${todayISO()}.csv`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
      markExported(); flash("File downloaded");
    } catch { flash("Download blocked here — copy the data instead"); }
  };
  const doEmail = () => {
    const subject = encodeURIComponent(`Migraine record — ${fmtDate(todayISO())}`);
    const body = encodeURIComponent(summary + "\n\n(Paste the full CSV below this line.)\n");
    let opened: Window | null = null;
    try { opened = window.open(`mailto:?subject=${subject}&body=${body}`, "_blank"); } catch { opened = null; }
    if (opened) markExported();
    else { doCopy(summary, "Summary"); flash("Mail app wouldn't open — summary copied, paste it into an email"); }
  };
  const doRestore = () => {
    try {
      const data = JSON.parse(restoreText);
      const list: unknown = Array.isArray(data) ? data : data.entries;
      if (!Array.isArray(list) || list.length === 0) throw new Error("shape");
      const byId: Record<string, MigraineEntry> = {};
      const normalise = (e: Partial<MigraineEntry>): MigraineEntry => ({
        ...emptyEntry(), ...e,
        id: e.id || uid(),
        symptoms: Array.isArray(e.symptoms) ? e.symptoms : [],
        triggers: Array.isArray(e.triggers) ? e.triggers : [],
      });
      [...entries, ...list.map(normalise)].forEach((e) => { if (e && e.id) byId[e.id] = e; });
      const merged = Object.values(byId).sort((a, b) => (b.date + b.startTime).localeCompare(a.date + a.startTime));
      setLog((prev) => ({ ...prev, entries: merged, preventive: data.preventive || prev.preventive }));
      setRestoreText("");
      flash(`Restored — ${merged.length} attacks in the record`);
    } catch { flash("That doesn't look like a backup code"); }
  };

  const doDriveSync = async () => {
    setDriveBusy(true);
    const res = await pushToDrive(log as MigraineLog);
    setDriveBusy(false);
    if (res.ok) { markExported(); flash("Saved to your Google Drive"); }
    else if (res.needsConnect) { flash("Connecting Google Drive…"); connectDrive(); }
    else { flash(`Drive save failed — ${res.error?.slice(0, 60) || "try again"}`); }
  };

  /* ================= LOG ================= */
  const LogTab = () => (
    <div>
      <div style={S.legend}>
        <span>{editingId ? "Amending an entry" : "New entry"}</span>
        <span>{draft.severity ? `SEV ${draft.severity}` : "SEV —"}</span>
      </div>

      <div style={S.block}>
        <label style={S.label}>Severity</label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: 2 }}>
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
            const filled = draft.severity >= n;
            return (
              <button key={n} onClick={() => setDraft((d) => ({ ...d, severity: n }))} aria-label={`Severity ${n}`} className="mr-t" style={{
                height: 46, borderRadius: 1, cursor: "pointer", padding: 0,
                background: filled ? sevColor(draft.severity) : "var(--paper)",
                border: `1px solid ${filled ? sevColor(draft.severity) : "var(--rule)"}`,
                color: filled ? sevText(draft.severity) : "var(--faint)",
                fontFamily: MONO, fontSize: 11, fontWeight: draft.severity === n ? 700 : 400,
              }}>{draft.severity === n ? n : ""}</button>
            );
          })}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontFamily: MONO, fontSize: 9, color: "var(--faint)", letterSpacing: "0.1em" }}>
          <span>1 NOTICEABLE</span><span>DISABLING 10</span>
        </div>
      </div>

      <div style={S.block}>
        <div style={{ display: "flex", gap: 9 }}>
          <div style={{ flex: 1 }}>
            <label style={S.label}>Date</label>
            <input type="date" style={S.input} value={draft.date} onChange={(e) => setDraft((d) => ({ ...d, date: e.target.value }))} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={S.label}>Onset</label>
            <input type="time" style={S.input} value={draft.startTime} onChange={(e) => setDraft((d) => ({ ...d, startTime: e.target.value }))} />
          </div>
        </div>
        <div style={{ marginTop: 13 }}>
          <label style={S.label}>Has it stopped?</label>
          <Row>
            <Tag on={draft.ongoing} onClick={() => setDraft((d) => ({ ...d, ongoing: true, endTime: "" }))}>Still going</Tag>
            <Tag on={!draft.ongoing} onClick={() => setDraft((d) => ({ ...d, ongoing: false, endTime: d.endTime || nowHM() }))}>Ended</Tag>
            {!draft.ongoing && (
              <input type="time" value={draft.endTime} onChange={(e) => setDraft((d) => ({ ...d, endTime: e.target.value }))} style={{ ...S.input, width: 128 }} />
            )}
          </Row>
        </div>
      </div>

      <div style={S.block}>
        <label style={S.label}>Location</label>
        <Row>{SIDES.map((s) => (
          <Tag key={s} on={draft.side === s} onClick={() => setDraft((d) => ({ ...d, side: d.side === s ? "" : s }))}>{s}</Tag>
        ))}</Row>
      </div>

      <div style={S.block}>
        <label style={S.label}>Symptoms</label>
        <Row>{SYMPTOMS.map((s) => (
          <Tag key={s} on={draft.symptoms.includes(s)} onClick={() => toggle("symptoms", s)}>{s}</Tag>
        ))}</Row>
      </div>

      <div style={S.block}>
        <label style={S.label}>Possible triggers</label>
        <Row>{TRIGGERS.map((t) => (
          <Tag key={t} on={draft.triggers.includes(t)} onClick={() => toggle("triggers", t)}>{t}</Tag>
        ))}</Row>
      </div>

      <div style={S.block}>
        <label style={S.label}>Medication taken</label>
        <Row>{QUICK_MEDS.map((m) => (
          <Tag key={m} on={draft.meds === m} onClick={() => setDraft((d) => ({ ...d, meds: d.meds === m ? "" : m }))}>{m}</Tag>
        ))}</Row>
        <input style={{ ...S.input, marginTop: 8 }} placeholder="Or type it — include the dose" value={draft.meds} onChange={(e) => setDraft((d) => ({ ...d, meds: e.target.value }))} />
        {draft.meds && draft.meds !== "None" && (
          <div style={{ marginTop: 12 }}>
            <label style={S.label}>Did it help?</label>
            <Row>{HELPED.map((h) => (
              <Tag key={h} on={draft.medHelped === h} onClick={() => setDraft((d) => ({ ...d, medHelped: d.medHelped === h ? "" : h }))}>{h}</Tag>
            ))}</Row>
          </div>
        )}
      </div>

      <div style={S.block}>
        <label style={S.label}>What it cost you</label>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {IMPACT.map((i) => (
            <Tag key={i.key} wide on={draft.impact === i.key} onClick={() => setDraft((d) => ({ ...d, impact: d.impact === i.key ? "" : i.key }))}>{i.label}</Tag>
          ))}
        </div>
      </div>

      <div style={S.block}>
        <label style={S.label}>Notes</label>
        <textarea style={{ ...S.input, minHeight: 72, resize: "vertical" }} placeholder="Sleep the night before, meals, anything unusual…" value={draft.notes} onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))} />
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={saveDraft} className="mr-t" style={{
          flex: 1, background: "var(--pen)", color: "#FFFFFF", border: "1px solid var(--pen)",
          borderRadius: 2, padding: "15px 0", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: SANS,
        }}>{editingId ? "Save changes" : "Record attack"}</button>
        {editingId && (
          <button onClick={() => { setDraft(emptyEntry()); setEditingId(null); }} className="mr-t" style={{
            background: "transparent", color: "var(--muted)", border: "1px solid var(--rule)",
            borderRadius: 2, padding: "15px 17px", fontSize: 14.5, cursor: "pointer", fontFamily: SANS,
          }}>Cancel</button>
        )}
      </div>
    </div>
  );

  /* ================= RECORD ================= */
  const RecordTab = () => {
    const { y, m } = monthCursor;
    const first = new Date(y, m, 1);
    const startPad = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const cells = [...Array(startPad).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
    const prefix = `${y}-${pad(m + 1)}`;
    const monthDays = Object.keys(peaks).filter((d) => d.startsWith(prefix)).length;
    const shift = (n: number) => {
      let ny = y, nm = m + n;
      if (nm < 0) { nm = 11; ny -= 1; }
      if (nm > 11) { nm = 0; ny += 1; }
      setMonthCursor({ y: ny, m: nm });
    };
    const NavBtn = ({ dir, children }: { dir: number; children: ReactNode }) => (
      <button onClick={() => shift(dir)} className="mr-t" style={{
        background: "transparent", border: "1px solid var(--rule)", color: "var(--ink)",
        borderRadius: 2, width: 36, height: 32, fontSize: 15, cursor: "pointer", fontFamily: MONO,
      }}>{children}</button>
    );

    return (
      <div>
        <div style={S.legend}><span>Observation chart</span><span>{monthDays} DAY{monthDays === 1 ? "" : "S"}</span></div>
        <div style={S.block}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <NavBtn dir={-1}>‹</NavBtn>
            <div style={{ fontFamily: MONO, fontSize: 13, letterSpacing: "0.14em", textTransform: "uppercase" }}>{MONTHS[m]} {y}</div>
            <NavBtn dir={1}>›</NavBtn>
          </div>
          <Trace year={y} month={m} peaks={peaks} medDays={allMedDays} />
          <div style={{ fontFamily: MONO, fontSize: 9, color: "var(--faint)", letterSpacing: "0.1em", marginTop: 4, textAlign: "center" }}>
            PEAK SEVERITY BY DAY  ·  RX = MEDICATION TAKEN
          </div>
        </div>

        <div style={S.block}>
          <label style={S.label}>Days affected</label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3, marginBottom: 4 }}>
            {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
              <div key={i} style={{ textAlign: "center", fontFamily: MONO, fontSize: 8.5, color: "var(--faint)", letterSpacing: "0.06em" }}>{d}</div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3 }}>
            {cells.map((d, i) => {
              if (d === null) return <div key={i} />;
              const iso = `${prefix}-${pad(d)}`;
              const sev = peaks[iso];
              const isToday = iso === todayISO();
              return (
                <div key={i} style={{
                  aspectRatio: "1 / 1", borderRadius: 1,
                  background: sev ? sevColor(sev) : "var(--paper)",
                  border: isToday ? "1.5px solid var(--pen)" : "1px solid var(--rule)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: MONO, fontSize: 10, color: sev ? sevText(sev) : "var(--faint)",
                }}>{d}</div>
              );
            })}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 11, fontFamily: MONO, fontSize: 8.5, color: "var(--faint)", letterSpacing: "0.08em" }}>
            <span>MILD</span>
            <div style={{ display: "flex", gap: 1, flex: 1 }}>{SEV.map((c, i) => (<div key={i} style={{ flex: 1, height: 6, background: c }} />))}</div>
            <span>SEVERE</span>
          </div>
        </div>

        <div style={{ ...S.legend, marginTop: 20 }}><span>Entries</span><span>{entries.length} TOTAL</span></div>
        {entries.length === 0 && (
          <div style={{ ...S.block, padding: "26px 16px" }}>
            <div style={{ fontFamily: MONO, fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 7 }}>Record is empty</div>
            <div style={{ color: "var(--muted)", fontSize: 13.5, lineHeight: 1.55 }}>
              Log the next attack as it happens. A severity and a time is enough — the pattern comes from consistency, not detail.
            </div>
          </div>
        )}
        {entries.map((e) => {
          const hrs = durationHours(e);
          return (
            <div key={e.id} style={S.block}>
              <div style={{ display: "flex", gap: 11, alignItems: "flex-start" }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 1, background: sevColor(e.severity),
                  color: sevText(e.severity), display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: MONO, fontSize: 16, flexShrink: 0,
                }}>{e.severity}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: MONO, fontSize: 12.5, letterSpacing: "0.06em" }}>{fmtDate(e.date)}</div>
                  <div style={{ fontFamily: MONO, fontSize: 11, color: "var(--muted)", marginTop: 3 }}>
                    {e.startTime}
                    {e.ongoing ? " · ONGOING" : hrs != null ? ` · ${hrs}H` : ""}
                    {e.side ? ` · ${e.side.toUpperCase()}` : ""}
                  </div>
                  {(e.triggers.length > 0 || e.meds) && (
                    <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 7, lineHeight: 1.5 }}>
                      {e.triggers.length > 0 && <div>Triggers: {e.triggers.join(", ")}</div>}
                      {e.meds && <div>Took: {e.meds}{e.medHelped ? ` — helped: ${e.medHelped.toLowerCase()}` : ""}</div>}
                    </div>
                  )}
                  {e.notes && (
                    <div style={{ fontSize: 12.5, color: "var(--faint)", marginTop: 6, lineHeight: 1.5, paddingLeft: 8, borderLeft: "2px solid var(--rule)" }}>{e.notes}</div>
                  )}
                  <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                    <button onClick={() => editEntry(e)} className="mr-t" style={{
                      background: "transparent", border: "1px solid var(--rule)", color: "var(--muted)",
                      borderRadius: 2, padding: "6px 11px", fontFamily: MONO, fontSize: 10, letterSpacing: "0.1em", cursor: "pointer" }}>EDIT</button>
                    <button onClick={() => deleteEntry(e.id)} className="mr-t" style={{
                      background: "transparent", border: "1px solid var(--rule)", color: "var(--faint)",
                      borderRadius: 2, padding: "6px 11px", fontFamily: MONO, fontSize: 10, letterSpacing: "0.1em", cursor: "pointer" }}>DELETE</button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  /* ================= FIGURES ================= */
  const FiguresTab = () => {
    const overuse = stats.medPerMonth >= 10;
    const watch = stats.medPerMonth >= 8 && stats.medPerMonth < 10;
    return (
      <div>
        <div style={S.legend}><span>Figures</span><span>{stats.attacks} ATTACKS</span></div>
        <Row>
          {([[30, "Last 30 days"], [90, "Last 90 days"], [0, "All records"]] as [number, string][]).map(([v, l]) => (
            <Tag key={v} on={window_ === v} onClick={() => setWindow_(v)}>{l}</Tag>
          ))}
        </Row>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9, marginTop: 14 }}>
          <Stat value={stats.headacheDays} unit="d" label="Headache days" />
          <Stat value={stats.perMonth} unit="/mo" label="Headache days per month" />
          <Stat value={stats.avgSev || "—"} unit={stats.avgSev ? "/10" : ""} label="Average severity" />
          <Stat value={stats.avgDur || "—"} unit={stats.avgDur ? "h" : ""} label="Average length" />
          <Stat value={stats.lostDays} unit="d" label="Days unable to function" />
          <Stat value={stats.auraCount} unit="" label="Attacks with aura" />
        </div>

        <div style={{ ...S.block, marginTop: 9, borderColor: overuse ? "var(--flag)" : "var(--rule)", borderLeftWidth: overuse ? 3 : 1 }}>
          <div style={{ fontFamily: MONO, fontSize: 27, lineHeight: 1, fontWeight: 500, color: overuse ? "var(--flag)" : "var(--ink)" }}>
            {stats.medPerMonth}<span style={{ fontSize: 12, color: "var(--faint)", marginLeft: 3 }}>d/mo</span>
          </div>
          <div style={{ fontFamily: MONO, fontSize: 9.5, color: "var(--muted)", letterSpacing: "0.12em", textTransform: "uppercase", marginTop: 9 }}>Acute medication days</div>
          <div style={{ ...S.note, color: overuse ? "var(--flag)" : "var(--muted)" }}>
            {overuse
              ? "Above 10 days a month. Painkillers taken this often can start driving headaches themselves — worth raising at your next appointment."
              : watch
                ? "Approaching 10 days a month, the level where painkillers can start driving headaches themselves. Worth watching."
                : "Under 10 days a month. This is the figure a doctor checks to rule out the painkillers themselves driving the headaches."}
          </div>
        </div>

        {stats.topTriggers.length > 0 && (
          <>
            <div style={{ ...S.legend, marginTop: 20 }}><span>Trigger frequency</span><span>TOP {stats.topTriggers.length}</span></div>
            <div style={S.block}>
              {stats.topTriggers.map(([t, n]) => (
                <div key={t} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                    <span>{t}</span><span style={{ fontFamily: MONO, fontSize: 11, color: "var(--muted)" }}>{n}</span>
                  </div>
                  <div style={{ height: 4, background: "var(--paper)", border: "1px solid var(--grid)" }}>
                    <div style={{ height: "100%", background: "var(--pen)", width: `${(n / stats.topTriggers[0][1]) * 100}%` }} />
                  </div>
                </div>
              ))}
              <div style={S.note}>Frequency is not cause. A trigger only means something if it shows up more often before attacks than on ordinary days.</div>
            </div>
          </>
        )}

        {stats.monthly.length > 1 && (
          <>
            <div style={{ ...S.legend, marginTop: 20 }}><span>Headache days by month</span></div>
            <div style={S.block}>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 5 }}>
                {stats.monthly.map(([k, n]) => {
                  const max = Math.max(...stats.monthly.map((x) => x[1]));
                  return (
                    <div key={k} style={{ flex: 1, textAlign: "center" }}>
                      <div style={{ fontFamily: MONO, fontSize: 10, color: "var(--muted)", marginBottom: 3 }}>{n}</div>
                      <div style={{ height: `${(n / max) * 56}px`, background: "var(--pen)", minHeight: 2 }} />
                      <div style={{ fontFamily: MONO, fontSize: 8.5, color: "var(--faint)", marginTop: 4, letterSpacing: "0.04em" }}>{MONTHS[Number(k.slice(5)) - 1]}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        <div style={{ ...S.legend, marginTop: 20 }}><span>Preventive in use</span></div>
        <div style={S.block}>
          <input style={S.input} placeholder="e.g. riboflavin 400 mg daily, since May" value={preventive} onChange={(e) => setPreventive(e.target.value)} />
          <div style={S.note}>Attached to every export, so the figures above are always read against what you were taking at the time.</div>
        </div>
      </div>
    );
  };

  /* ================= BACKUP / SYNC ================= */
  const BackupTab = () => {
    const since = daysAgo(lastExport);
    const stale = !lastExport || since > 30;
    return (
      <div>
        {/* Sync status: the account tier */}
        <div style={S.legend}><span>Sync</span><span>{signedIn ? "SIGNED IN" : "THIS DEVICE ONLY"}</span></div>
        <div style={S.block}>
          {signedIn ? (
            <>
              <div style={{ fontSize: 13.5, lineHeight: 1.6 }}>
                Signed in as <strong>{user?.email}</strong>. Your record syncs to your account automatically —
                open this tool on any device you sign in on and it&apos;s here.
              </div>
              <div style={S.note}>{SYNC_LABEL[syncState] ? `Status: ${SYNC_LABEL[syncState].toLowerCase()}.` : ""}</div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 13.5, lineHeight: 1.6 }}>
                This record is saved on <strong>this device only</strong>. Sign in with your Google account to
                sync it to your profile and reach it from any device.
              </div>
              <Link href="/guardian/login?returnTo=/tools/migraine-tracker" className="mr-t" style={{
                display: "inline-block", marginTop: 11, background: "var(--pen)", color: "#fff",
                border: "1px solid var(--pen)", borderRadius: 2, padding: "10px 15px", fontSize: 14,
                fontWeight: 600, textDecoration: "none", fontFamily: SANS,
              }}>Sign in to sync</Link>
            </>
          )}
        </div>

        {signedIn && (
          <>
            <div style={{ ...S.legend, marginTop: 20 }}><span>Google Drive</span></div>
            <Action primary disabled={driveBusy} onClick={doDriveSync}
              title={driveBusy ? "Saving to Drive…" : "Save a backup to Google Drive"}
              sub="Writes one JSON backup file to your Drive (updates it each time). First use asks Google for permission to that one file." />
          </>
        )}

        <div style={{ ...S.legend, marginTop: 20 }}><span>Backup reminder</span><span>{entries.length} STORED</span></div>
        <div style={{ ...S.block, borderColor: stale ? "var(--flag)" : "var(--rule)", borderLeftWidth: stale ? 3 : 1 }}>
          <div style={{ fontSize: 13.5, lineHeight: 1.6, color: stale ? "var(--flag)" : "var(--ink)" }}>
            {!lastExport
              ? "Not exported yet. Do it once now to learn the routine, then again before each appointment."
              : since === 0 ? "Exported today. You are covered."
              : stale ? `Last export ${since} days ago. Worth doing again.`
              : `Last export ${since} ${since === 1 ? "day" : "days"} ago.`}
          </div>
        </div>

        <div style={{ ...S.legend, marginTop: 20 }}><span>Into a spreadsheet</span></div>
        <Action primary onClick={() => doCopy(csv, "Spreadsheet data")}
          title="Copy as spreadsheet data"
          sub="Paste straight into a Google Sheet — one row per attack, a column for every field." />
        <Action onClick={doDownload} title="Download the CSV" sub="Save to Drive, or open with Sheets. Easiest on a computer." />
        <Action onClick={() => doCopy(JSON.stringify({ entries, preventive }), "Backup code")}
          title="Copy the backup code"
          sub="The whole record as one block of text. Email it to yourself — pasting it back restores everything exactly." />

        <div style={{ ...S.legend, marginTop: 20 }}><span>For your doctor</span></div>
        <Action primary onClick={doEmail} title="Email the summary to yourself" sub="Opens your mail app with the figures already written out." />
        <Action onClick={() => doCopy(summary, "Summary")} title="Copy the summary" sub="Headache days per month, medication days, triggers, severity — the figures they ask for." />

        {showRaw && (
          <div style={{ ...S.block, marginTop: 12 }}>
            <label style={S.label}>Select all of this and copy it</label>
            <textarea readOnly value={showRaw} onFocus={(e) => e.target.select()} style={{ ...S.input, minHeight: 140, fontSize: 12, fontFamily: MONO }} />
            <button onClick={() => setShowRaw(null)} className="mr-t" style={{
              background: "transparent", border: "1px solid var(--rule)", color: "var(--muted)",
              borderRadius: 2, padding: "9px 13px", fontFamily: MONO, fontSize: 10, letterSpacing: "0.1em", marginTop: 8, cursor: "pointer" }}>DONE</button>
          </div>
        )}

        <div style={{ ...S.legend, marginTop: 20 }}><span>Bring a record back</span></div>
        <div style={S.block}>
          <textarea value={restoreText} onChange={(e) => setRestoreText(e.target.value)} placeholder="Paste a backup code here" style={{ ...S.input, minHeight: 80, fontSize: 12, fontFamily: MONO }} />
          <button onClick={doRestore} disabled={!restoreText.trim()} className="mr-t" style={{
            background: "transparent", border: "1px solid var(--rule)",
            color: restoreText.trim() ? "var(--ink)" : "var(--faint)",
            borderRadius: 2, padding: "11px 15px", fontSize: 14, marginTop: 9,
            cursor: restoreText.trim() ? "pointer" : "default", fontFamily: SANS }}>Restore this record</button>
          <div style={S.note}>Merges with what is already here. Nothing gets overwritten.</div>
        </div>

        {syncState === "error" && signedIn && (
          <div style={{ ...S.block, borderColor: "var(--flag)", marginTop: 12 }}>
            <div style={{ fontSize: 13, color: "var(--flag)", lineHeight: 1.55 }}>
              Couldn&apos;t sync to your account just now. Your record is still saved on this device — copy the backup code before closing if you&apos;re unsure.
            </div>
          </div>
        )}
      </div>
    );
  };

  /* ================= SHELL ================= */
  const TABS = [
    { key: "log", label: "LOG" },
    { key: "record", label: "CHART" },
    { key: "figures", label: "FIGURES" },
    { key: "backup", label: "BACKUP" },
  ];
  const vars = THEMES[theme] as CSSProperties;

  if (!loaded) {
    return (
      <div style={{ ...S.page, ...vars, alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.2em", color: "var(--muted)" }}>OPENING RECORD</div>
      </div>
    );
  }

  return (
    <div style={{ ...S.page, ...vars }}>
      <style>{`
        .mr-t { -webkit-tap-highlight-color: transparent; transition: background .1s linear, border-color .1s linear; }
        .mr-t:focus-visible { outline: 2px solid var(--pen); outline-offset: 1px; }
        input:focus, textarea:focus { border-color: var(--pen) !important; }
        input::placeholder, textarea::placeholder { color: var(--faint); }
        input[type="date"], input[type="time"] { color-scheme: ${theme === "dim" ? "dark" : "light"}; }
        @media (prefers-reduced-motion: reduce) { .mr-t { transition: none; } }
      `}</style>

      <header style={{ padding: "14px 14px 11px", borderBottom: "1px solid var(--rule)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Link href="/tools" style={{ color: "var(--muted)", textDecoration: "none", fontFamily: MONO, fontSize: 15, lineHeight: 1 }} aria-label="Back to tools">‹</Link>
            <div style={{ fontFamily: MONO, fontSize: 12.5, letterSpacing: "0.16em", textTransform: "uppercase" }}>Migraine Record</div>
          </div>
          <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.14em", color: "var(--faint)", marginTop: 3 }}>
            {fmtDate(todayISO()).toUpperCase()}
            {signedIn && syncState !== "idle" ? `  ·  ${SYNC_LABEL[syncState]}` : signedIn ? "  ·  SYNCED" : "  ·  LOCAL"}
          </div>
        </div>
        <button onClick={() => setThemeOverride(theme === "day" ? "dim" : "day")} className="mr-t"
          aria-label={theme === "day" ? "Switch to dim" : "Switch to daylight"} style={{
            background: "transparent", border: "1px solid var(--rule)", color: "var(--muted)",
            borderRadius: 2, padding: "7px 11px", fontFamily: MONO, fontSize: 9.5, letterSpacing: "0.14em", cursor: "pointer", flexShrink: 0 }}>
          {theme === "day" ? "DIM" : "DAY"}
        </button>
      </header>

      <div style={S.body}>
        {tab === "log" && LogTab()}
        {tab === "record" && RecordTab()}
        {tab === "figures" && FiguresTab()}
        {tab === "backup" && BackupTab()}
      </div>

      {toast && (
        <div style={{ position: "fixed", bottom: 76, left: 14, right: 14, background: "var(--ink)", color: "var(--paper)", borderRadius: 2, padding: "11px 14px", fontSize: 13, zIndex: 50, lineHeight: 1.4, maxWidth: 560, margin: "0 auto" }}>
          {toast}
        </div>
      )}

      <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "var(--card)", borderTop: "1px solid var(--rule)", display: "flex", paddingBottom: "env(safe-area-inset-bottom)" }}>
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className="mr-t" style={{
            flex: 1, background: tab === t.key ? "var(--paper)" : "transparent",
            border: "none", borderTop: `2px solid ${tab === t.key ? "var(--pen)" : "transparent"}`,
            marginTop: -1, cursor: "pointer", padding: "13px 0 14px",
            fontFamily: MONO, fontSize: 9.5, letterSpacing: "0.13em",
            color: tab === t.key ? "var(--ink)" : "var(--faint)",
          }}>{t.label}</button>
        ))}
      </nav>
    </div>
  );
}
