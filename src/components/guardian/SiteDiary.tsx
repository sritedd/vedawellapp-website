"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/guardian/Toast";

interface SiteDiaryProps {
  projectId: string;
  onSaved?: () => void;
}

const AREA_TAGS = [
  "Kitchen", "Bathroom", "Bedroom", "Living Room", "Garage",
  "Laundry", "Exterior", "Roof", "Foundation", "Garden",
  "Driveway", "Balcony", "Ensuite", "Study", "Hallway",
];

const TRADE_TAGS = [
  "Builder", "Electrician", "Plumber", "Tiler", "Painter",
  "Carpenter", "Plasterer", "Bricklayer", "Roofer", "Landscaper",
  "Cabinetmaker", "Concreter", "Waterproofer", "Glazier", "HVAC",
];

export default function SiteDiary({ projectId, onSaved }: SiteDiaryProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [weatherStatus, setWeatherStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    time: new Date().toTimeString().slice(0, 5),
    purpose: "Weekly Progress Check",
    observations: "",
    concerns: "",
    followUpActions: "",
    workersOnSite: 0,
    gpsLat: null as number | null,
    gpsLng: null as number | null,
    gpsAccuracy: null as number | null,
    weatherTemp: "",
    weatherDescription: "",
    voiceNotes: "",
    areaTags: [] as string[],
    tradeTags: [] as string[],
  });

  const captureGPS = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsStatus("error");
      return;
    }
    setGpsStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((prev) => ({
          ...prev,
          gpsLat: pos.coords.latitude,
          gpsLng: pos.coords.longitude,
          gpsAccuracy: pos.coords.accuracy,
        }));
        setGpsStatus("done");
      },
      () => setGpsStatus("error"),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const fetchWeather = useCallback(async () => {
    if (!form.gpsLat || !form.gpsLng) {
      // Try GPS first
      captureGPS();
      return;
    }
    setWeatherStatus("loading");
    try {
      // Use free Open-Meteo API (no key needed)
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${form.gpsLat}&longitude=${form.gpsLng}&current=temperature_2m,weather_code`
      );
      if (res.ok) {
        const data = await res.json();
        const temp = data.current?.temperature_2m;
        const code = data.current?.weather_code;
        const desc = weatherCodeToDescription(code);
        setForm((prev) => ({
          ...prev,
          weatherTemp: temp ? `${temp}°C` : "",
          weatherDescription: desc,
        }));
        setWeatherStatus("done");
      } else {
        setWeatherStatus("error");
      }
    } catch {
      setWeatherStatus("error");
    }
  }, [form.gpsLat, form.gpsLng, captureGPS]);

  const toggleTag = (list: "areaTags" | "tradeTags", tag: string) => {
    setForm((prev) => ({
      ...prev,
      [list]: prev[list].includes(tag)
        ? prev[list].filter((t) => t !== tag)
        : [...prev[list], tag],
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    const { error } = await supabase.from("site_visits").insert({
      project_id: projectId,
      user_id: user.id,
      date: form.date,
      time: form.time,
      purpose: form.purpose,
      observations: form.observations,
      concerns: form.concerns ? form.concerns.split("\n").filter(Boolean) : [],
      follow_up_actions: form.followUpActions ? form.followUpActions.split("\n").filter(Boolean) : [],
      workers_on_site: form.workersOnSite,
      weather_conditions: form.weatherDescription ? `${form.weatherTemp} ${form.weatherDescription}` : "",
      gps_lat: form.gpsLat,
      gps_lng: form.gpsLng,
      gps_accuracy: form.gpsAccuracy,
      weather_temp: form.weatherTemp,
      weather_description: form.weatherDescription,
      evidence_mode: true,
      voice_notes: form.voiceNotes || null,
      area_tags: form.areaTags.length > 0 ? form.areaTags : null,
      trade_tags: form.tradeTags.length > 0 ? form.tradeTags : null,
    });

    setSaving(false);
    if (error) {
      toast(`Failed to save site visit: ${error.message}`, "error");
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    onSaved?.();
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-bold text-lg mb-1">Site Diary — Evidence Mode</h3>
        <p className="text-sm text-muted">
          Record a tribunal-grade site visit with GPS, weather, and tagged evidence.
        </p>
      </div>

      {/* Auto-capture bar */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={captureGPS}
          disabled={gpsStatus === "loading"}
          className={`px-3 py-2 text-xs font-medium rounded border transition-colors ${
            gpsStatus === "done" ? "bg-green-500/10 border-green-500/20 text-green-700" :
            gpsStatus === "error" ? "bg-red-500/10 border-red-500/20 text-red-700" :
            "border-border hover:border-primary"
          }`}
        >
          {gpsStatus === "loading" ? "Locating..." :
           gpsStatus === "done" ? `📍 ${form.gpsLat?.toFixed(4)}, ${form.gpsLng?.toFixed(4)}` :
           gpsStatus === "error" ? "📍 GPS Failed" : "📍 Capture GPS"}
        </button>
        <button
          onClick={fetchWeather}
          disabled={weatherStatus === "loading"}
          className={`px-3 py-2 text-xs font-medium rounded border transition-colors ${
            weatherStatus === "done" ? "bg-green-500/10 border-green-500/20 text-green-700" :
            weatherStatus === "error" ? "bg-red-500/10 border-red-500/20 text-red-700" :
            "border-border hover:border-primary"
          }`}
        >
          {weatherStatus === "loading" ? "Fetching..." :
           weatherStatus === "done" ? `🌤️ ${form.weatherTemp} ${form.weatherDescription}` :
           weatherStatus === "error" ? "🌤️ Weather Failed" : "🌤️ Capture Weather"}
        </button>
        <div className="px-3 py-2 text-xs rounded border border-border bg-muted/5">
          🕐 {form.date} {form.time}
        </div>
      </div>

      <div className="card space-y-4">
        {/* Basic fields */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted mb-1 block">Date</label>
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded border border-border bg-background" />
          </div>
          <div>
            <label className="text-xs text-muted mb-1 block">Purpose</label>
            <select value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded border border-border bg-background">
              {["Weekly Progress Check", "Scheduled Inspection", "Defect Inspection", "Pre-Handover Walk",
                "Meeting with Builder", "Unscheduled Visit", "Warranty Inspection"].map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs text-muted mb-1 block">Observations</label>
          <textarea value={form.observations} onChange={(e) => setForm({ ...form, observations: e.target.value })}
            rows={3} placeholder="What did you see? Be specific — this is evidence."
            className="w-full px-3 py-2 text-sm rounded border border-border bg-background resize-none" />
        </div>

        <div>
          <label className="text-xs text-muted mb-1 block">Concerns (one per line)</label>
          <textarea value={form.concerns} onChange={(e) => setForm({ ...form, concerns: e.target.value })}
            rows={2} placeholder="Waterproofing not complete in ensuite&#10;Brickwork appears uneven on south wall"
            className="w-full px-3 py-2 text-sm rounded border border-border bg-background resize-none" />
        </div>

        <div>
          <label className="text-xs text-muted mb-1 block">Voice Notes / Transcription</label>
          <textarea value={form.voiceNotes} onChange={(e) => setForm({ ...form, voiceNotes: e.target.value })}
            rows={2} placeholder="Paste voice transcription or type notes..."
            className="w-full px-3 py-2 text-sm rounded border border-border bg-background resize-none" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted mb-1 block">Workers on Site</label>
            <input type="number" value={form.workersOnSite} onChange={(e) => setForm({ ...form, workersOnSite: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 text-sm rounded border border-border bg-background" />
          </div>
          <div>
            <label className="text-xs text-muted mb-1 block">Follow-up Actions (one per line)</label>
            <textarea value={form.followUpActions} onChange={(e) => setForm({ ...form, followUpActions: e.target.value })}
              rows={1} placeholder="Email builder about waterproofing"
              className="w-full px-3 py-2 text-sm rounded border border-border bg-background resize-none" />
          </div>
        </div>

        {/* Area tags */}
        <div>
          <label className="text-xs text-muted mb-2 block">Areas Inspected</label>
          <div className="flex flex-wrap gap-1.5">
            {AREA_TAGS.map((tag) => (
              <button key={tag} onClick={() => toggleTag("areaTags", tag)}
                className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                  form.areaTags.includes(tag) ? "bg-primary text-white border-primary" : "border-border hover:border-primary"
                }`}>{tag}</button>
            ))}
          </div>
        </div>

        {/* Trade tags */}
        <div>
          <label className="text-xs text-muted mb-2 block">Trades Present</label>
          <div className="flex flex-wrap gap-1.5">
            {TRADE_TAGS.map((tag) => (
              <button key={tag} onClick={() => toggleTag("tradeTags", tag)}
                className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                  form.tradeTags.includes(tag) ? "bg-primary text-white border-primary" : "border-border hover:border-primary"
                }`}>{tag}</button>
            ))}
          </div>
        </div>

        <button onClick={handleSave} disabled={saving || !form.observations}
          className="w-full px-4 py-2.5 text-sm font-medium rounded bg-primary text-white hover:opacity-90 disabled:opacity-50">
          {saving ? "Saving..." : saved ? "Saved!" : "Save Site Diary Entry"}
        </button>
      </div>
    </div>
  );
}

function weatherCodeToDescription(code: number): string {
  if (code === 0) return "Clear sky";
  if (code <= 3) return "Partly cloudy";
  if (code <= 49) return "Foggy";
  if (code <= 59) return "Drizzle";
  if (code <= 69) return "Rain";
  if (code <= 79) return "Snow";
  if (code <= 84) return "Rain showers";
  if (code <= 94) return "Thunderstorm";
  return "Severe weather";
}
