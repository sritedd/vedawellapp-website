"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/guardian/Toast";
import {
  ESCALATION_LEVELS,
  type TemplateParams,
} from "@/data/escalation-templates";

// Use the correct import name
const escalationGenerators = ESCALATION_LEVELS;

interface Escalation {
  id: string;
  defect_id: string | null;
  level: number;
  status: string;
  builder_name: string | null;
  builder_email: string | null;
  notes: string | null;
  letter_type: string | null;
  letter_generated_at: string | null;
  created_at: string;
}

interface Defect {
  id: string;
  title: string;
  severity: string;
  status: string;
  created_at: string;
}

const LEVEL_COLORS: Record<number, string> = {
  1: "bg-blue-500",
  2: "bg-yellow-500",
  3: "bg-amber-500",
  4: "bg-red-500",
};

const LEVEL_BG: Record<number, string> = {
  1: "bg-blue-500/10 border-blue-500/20 text-blue-700",
  2: "bg-yellow-500/10 border-yellow-500/20 text-yellow-700",
  3: "bg-amber-500/10 border-amber-500/20 text-amber-700",
  4: "bg-red-500/10 border-red-500/20 text-red-700",
};

export default function BuilderEscalation({ projectId }: { projectId: string }) {
  const { toast } = useToast();
  const [escalations, setEscalations] = useState<Escalation[]>([]);
  const [defects, setDefects] = useState<Defect[]>([]);
  const [selectedDefect, setSelectedDefect] = useState("");
  const [loading, setLoading] = useState(true);
  const [generatedLetter, setGeneratedLetter] = useState("");
  const [activeLevel, setActiveLevel] = useState(0);
  const [copied, setCopied] = useState(false);
  const [projectState, setProjectState] = useState("NSW");
  const [projectAddress, setProjectAddress] = useState("");
  const [builderName, setBuilderName] = useState("");
  const [homeownerName, setHomeownerName] = useState("");

  const supabase = createClient();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [escRes, defRes, projRes] = await Promise.all([
        supabase.from("escalations").select("*").eq("project_id", projectId).order("created_at", { ascending: false }),
        supabase.from("defects").select("id, title, severity, status, created_at").eq("project_id", projectId).not("status", "in", "(verified,rectified)"),
        supabase.from("projects").select("state, address, builder_name").eq("id", projectId).single(),
      ]);

      setEscalations(escRes.data || []);
      setDefects(defRes.data || []);
      if (projRes.data) {
        setProjectState(projRes.data.state || "NSW");
        setProjectAddress(projRes.data.address || "");
        setBuilderName(projRes.data.builder_name || "");
      }

      // Set active level from most recent active escalation
      const active = (escRes.data || []).find((e: Escalation) => e.status === "active");
      if (active) setActiveLevel(active.level);
    } catch (err) {
      console.error("[Escalation] fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [projectId, supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const startEscalation = async (level: number) => {
    const defect = defects.find((d) => d.id === selectedDefect);
    if (!level) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("escalations").insert({
      project_id: projectId,
      defect_id: selectedDefect || null,
      user_id: user.id,
      level,
      status: "active",
      builder_name: builderName,
      letter_type: escalationGenerators[level - 1]?.name || `Level ${level}`,
    });

    if (error) {
      toast(`Could not start escalation: ${error.message}`, "error");
      return;
    }
    // Generate letter
    const params: TemplateParams = {
      homeownerName: homeownerName || "Homeowner",
      builderName: builderName || "Builder",
      defectDescription: defect?.title || "Unspecified defect",
      projectAddress,
      daysSinceReport: defect ? Math.floor((Date.now() - new Date(defect.created_at).getTime()) / 86400000) : 0,
      state: projectState,
    };
    const letter = escalationGenerators[level - 1]?.generator(params) || "";
    setGeneratedLetter(letter);
    setActiveLevel(level);
    fetchData();
  };

  const generateLetter = (level: number) => {
    const defect = defects.find((d) => d.id === selectedDefect);
    const params: TemplateParams = {
      homeownerName: homeownerName || "Homeowner",
      builderName: builderName || "Builder",
      defectDescription: defect?.title || "Unspecified defect",
      projectAddress,
      daysSinceReport: defect ? Math.floor((Date.now() - new Date(defect.created_at).getTime()) / 86400000) : 0,
      state: projectState,
    };
    const letter = escalationGenerators[level - 1]?.generator(params) || "";
    setGeneratedLetter(letter);
  };

  const copyLetter = async () => {
    await navigator.clipboard.writeText(generatedLetter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-bold text-lg mb-1">Builder Escalation</h3>
        <p className="text-sm text-muted">Formally escalate unresolved defects through a 4-step process.</p>
      </div>

      {/* Escalation Stepper */}
      <div className="flex items-center gap-1">
        {ESCALATION_LEVELS.map((lvl, i) => (
          <div key={lvl.level} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold
                  ${activeLevel >= lvl.level ? LEVEL_COLORS[lvl.level] : "bg-muted/30 text-muted"}`}
              >
                {lvl.level}
              </div>
              <span className={`text-xs mt-1 text-center ${activeLevel >= lvl.level ? "font-medium" : "text-muted"}`}>
                {lvl.name}
              </span>
            </div>
            {i < 3 && (
              <div className={`h-0.5 w-full ${activeLevel > lvl.level ? LEVEL_COLORS[lvl.level] : "bg-muted/20"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Setup form */}
      <div className="card space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted mb-1 block">Your Name</label>
            <input
              type="text"
              value={homeownerName}
              onChange={(e) => setHomeownerName(e.target.value)}
              placeholder="Your full name"
              className="w-full px-3 py-2 text-sm rounded border border-border bg-background"
            />
          </div>
          <div>
            <label className="text-xs text-muted mb-1 block">Builder Name</label>
            <input
              type="text"
              value={builderName}
              onChange={(e) => setBuilderName(e.target.value)}
              placeholder="Builder company/name"
              className="w-full px-3 py-2 text-sm rounded border border-border bg-background"
            />
          </div>
        </div>

        <div>
          <label className="text-xs text-muted mb-1 block">Select Defect to Escalate</label>
          <select
            value={selectedDefect}
            onChange={(e) => setSelectedDefect(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded border border-border bg-background"
          >
            <option value="">— Select a defect —</option>
            {defects.map((d) => (
              <option key={d.id} value={d.id}>
                [{d.severity}] {d.title}
              </option>
            ))}
          </select>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 flex-wrap">
          {activeLevel === 0 && (
            <button
              onClick={() => startEscalation(1)}
              disabled={!selectedDefect}
              className="px-4 py-2 text-sm font-medium rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Start Escalation (Level 1)
            </button>
          )}
          {activeLevel > 0 && activeLevel < 4 && (
            <button
              onClick={() => startEscalation(activeLevel + 1)}
              className={`px-4 py-2 text-sm font-medium rounded text-white hover:opacity-90 ${LEVEL_COLORS[activeLevel + 1]}`}
            >
              Escalate to Level {activeLevel + 1}: {ESCALATION_LEVELS[activeLevel]?.name}
            </button>
          )}
          {ESCALATION_LEVELS.map((lvl) => (
            <button
              key={lvl.level}
              onClick={() => generateLetter(lvl.level)}
              className={`px-3 py-1.5 text-xs rounded border ${LEVEL_BG[lvl.level]}`}
            >
              Preview Level {lvl.level}
            </button>
          ))}
        </div>
      </div>

      {/* Generated Letter */}
      {generatedLetter && (
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold text-sm">Generated Letter</h4>
            <button
              onClick={copyLetter}
              className="px-3 py-1 text-xs rounded bg-primary text-white hover:opacity-90"
            >
              {copied ? "Copied!" : "Copy to Clipboard"}
            </button>
          </div>
          <pre className="text-sm whitespace-pre-wrap font-mono bg-muted/10 p-4 rounded border border-border max-h-96 overflow-y-auto">
            {generatedLetter}
          </pre>
        </div>
      )}

      {/* Escalation History */}
      {escalations.length > 0 && (
        <div>
          <h4 className="font-bold text-sm mb-3">Escalation History</h4>
          <div className="space-y-2">
            {escalations.map((esc) => (
              <div key={esc.id} className={`p-3 rounded border text-sm ${LEVEL_BG[esc.level]}`}>
                <div className="flex items-center justify-between">
                  <span className="font-medium">
                    Level {esc.level}: {ESCALATION_LEVELS[esc.level - 1]?.name}
                  </span>
                  <span className="text-xs opacity-70">
                    {new Date(esc.created_at).toLocaleDateString("en-AU")}
                  </span>
                </div>
                {esc.notes && <p className="text-xs mt-1 opacity-80">{esc.notes}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
