"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface Prefs {
  defect_reminders: boolean;
  payment_alerts: boolean;
  certificate_expiry: boolean;
  weekly_digest: boolean;
  warranty_reminders: boolean;
  insurance_expiry: boolean;
}

const PREF_ITEMS: { key: keyof Prefs; title: string; desc: string }[] = [
  { key: "defect_reminders", title: "Defect reminders", desc: "Get reminded about unresolved defects at 7, 14, and 30 days" },
  { key: "payment_alerts", title: "Payment due dates", desc: "Notified when stage payments are approaching" },
  { key: "certificate_expiry", title: "Certificate expiry", desc: "Alerts when certificates are about to expire" },
  { key: "weekly_digest", title: "Weekly email digest", desc: "Summary of your build progress every Monday" },
  { key: "warranty_reminders", title: "Warranty deadlines", desc: "Alerts before warranty periods expire" },
  { key: "insurance_expiry", title: "Insurance expiry", desc: "Warned when builder's insurance is expiring" },
];

const DEFAULTS: Prefs = {
  defect_reminders: true,
  payment_alerts: true,
  certificate_expiry: true,
  weekly_digest: true,
  warranty_reminders: true,
  insurance_expiry: true,
};

export default function NotificationPreferences() {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (data) {
        setPrefs({
          defect_reminders: data.defect_reminders ?? true,
          payment_alerts: data.payment_alerts ?? true,
          certificate_expiry: data.certificate_expiry ?? true,
          weekly_digest: data.weekly_digest ?? true,
          warranty_reminders: data.warranty_reminders ?? true,
          insurance_expiry: data.insurance_expiry ?? true,
        });
      }
      setLoading(false);
    })();
  }, [supabase]);

  const handleToggle = (key: keyof Prefs) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    const { error } = await supabase
      .from("notification_preferences")
      .upsert({
        user_id: user.id,
        ...prefs,
      }, { onConflict: "user_id" });

    setSaving(false);
    if (!error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-4"><div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-bold text-sm">Notification Preferences</h3>
        <p className="text-xs text-muted mt-0.5">Choose which notifications you receive via email.</p>
      </div>

      <div className="space-y-1">
        {PREF_ITEMS.map((item) => (
          <label key={item.key} className="flex items-center justify-between py-3 px-3 rounded hover:bg-muted/5 cursor-pointer">
            <div>
              <div className="text-sm font-medium">{item.title}</div>
              <div className="text-xs text-muted">{item.desc}</div>
            </div>
            <button
              onClick={() => handleToggle(item.key)}
              className={`relative w-10 h-5 rounded-full transition-colors ${prefs[item.key] ? "bg-primary" : "bg-muted/30"}`}
            >
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${prefs[item.key] ? "left-5" : "left-0.5"}`} />
            </button>
          </label>
        ))}
      </div>

      <button onClick={handleSave} disabled={saving}
        className="px-4 py-2 text-sm font-medium rounded bg-primary text-white hover:opacity-90 disabled:opacity-50">
        {saving ? "Saving..." : saved ? "Saved!" : "Save Preferences"}
      </button>
    </div>
  );
}
