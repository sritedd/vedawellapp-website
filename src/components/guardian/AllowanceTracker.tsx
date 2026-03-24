"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

interface Allowance {
  id: string;
  category: string;
  item_name: string;
  allowance_type: string;
  contract_amount: number;
  actual_amount: number | null;
  supplier: string | null;
  notes: string | null;
  status: string;
}

const CATEGORIES = [
  "Kitchen Appliances", "Kitchen Cabinetry", "Bathroom Fixtures", "Flooring",
  "Tiles", "Lighting", "Electrical", "Plumbing Fixtures", "Landscaping",
  "Driveway", "Fencing", "Window Coverings", "Paint", "HVAC", "Other",
];

export default function AllowanceTracker({ projectId }: { projectId: string }) {
  const [allowances, setAllowances] = useState<Allowance[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    category: "Kitchen Appliances",
    itemName: "",
    allowanceType: "pc" as "pc" | "ps",
    contractAmount: "",
    actualAmount: "",
    supplier: "",
    notes: "",
    status: "pending",
  });

  const supabase = createClient();

  const fetchAllowances = useCallback(async () => {
    const { data } = await supabase
      .from("allowances")
      .select("*")
      .eq("project_id", projectId)
      .order("category", { ascending: true });
    setAllowances(data || []);
    setLoading(false);
  }, [projectId, supabase]);

  useEffect(() => { fetchAllowances(); }, [fetchAllowances]);

  const handleAdd = async () => {
    if (!form.itemName || !form.contractAmount) return;
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    await supabase.from("allowances").insert({
      project_id: projectId,
      user_id: user.id,
      category: form.category,
      item_name: form.itemName,
      allowance_type: form.allowanceType,
      contract_amount: parseFloat(form.contractAmount),
      actual_amount: form.actualAmount ? parseFloat(form.actualAmount) : null,
      supplier: form.supplier || null,
      notes: form.notes || null,
      status: form.status,
    });

    setForm({ category: "Kitchen Appliances", itemName: "", allowanceType: "pc", contractAmount: "", actualAmount: "", supplier: "", notes: "", status: "pending" });
    setShowForm(false);
    setSaving(false);
    fetchAllowances();
  };

  const updateActual = async (id: string, actual: string) => {
    await supabase.from("allowances").update({
      actual_amount: actual ? parseFloat(actual) : null,
      status: actual ? "selected" : "pending",
    }).eq("id", id);
    fetchAllowances();
  };

  const deleteAllowance = async (id: string) => {
    if (!confirm("Delete this allowance?")) return;
    await supabase.from("allowances").delete().eq("id", id);
    fetchAllowances();
  };

  // Compute totals
  const totalContract = allowances.reduce((s, a) => s + Number(a.contract_amount), 0);
  const totalActual = allowances.reduce((s, a) => s + (a.actual_amount ? Number(a.actual_amount) : Number(a.contract_amount)), 0);
  const totalDrift = totalActual - totalContract;
  const itemsWithActual = allowances.filter((a) => a.actual_amount !== null);

  if (loading) {
    return <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-lg mb-1">PC / PS Allowance Tracker</h3>
          <p className="text-sm text-muted">Track Prime Cost and Provisional Sum allowances vs actual selections.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="px-3 py-1.5 text-sm font-medium rounded bg-primary text-white hover:opacity-90">
          + Add
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card text-center">
          <div className="text-xs text-muted mb-1">Contract Allowances</div>
          <div className="text-lg font-bold">${totalContract.toLocaleString()}</div>
        </div>
        <div className="card text-center">
          <div className="text-xs text-muted mb-1">Actual Selections</div>
          <div className="text-lg font-bold">${totalActual.toLocaleString()}</div>
          <div className="text-xs text-muted">{itemsWithActual.length}/{allowances.length} selected</div>
        </div>
        <div className="card text-center">
          <div className="text-xs text-muted mb-1">Budget Drift</div>
          <div className={`text-lg font-bold ${totalDrift > 0 ? "text-red-600" : totalDrift < 0 ? "text-green-600" : ""}`}>
            {totalDrift > 0 ? "+" : ""}{totalDrift === 0 ? "$0" : `$${totalDrift.toLocaleString()}`}
          </div>
          <div className="text-xs text-muted">{totalDrift > 0 ? "Over budget" : totalDrift < 0 ? "Under budget" : "On budget"}</div>
        </div>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="card space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted mb-1 block">Category</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded border border-border bg-background">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted mb-1 block">Type</label>
              <select value={form.allowanceType} onChange={(e) => setForm({ ...form, allowanceType: e.target.value as "pc" | "ps" })}
                className="w-full px-3 py-2 text-sm rounded border border-border bg-background">
                <option value="pc">Prime Cost (PC)</option>
                <option value="ps">Provisional Sum (PS)</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-muted mb-1 block">Item Name</label>
            <input type="text" value={form.itemName} onChange={(e) => setForm({ ...form, itemName: e.target.value })}
              placeholder="e.g. Dishwasher, Floor tiles, Tapware"
              className="w-full px-3 py-2 text-sm rounded border border-border bg-background" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted mb-1 block">Contract Allowance ($)</label>
              <input type="number" value={form.contractAmount} onChange={(e) => setForm({ ...form, contractAmount: e.target.value })}
                placeholder="8000" className="w-full px-3 py-2 text-sm rounded border border-border bg-background" />
            </div>
            <div>
              <label className="text-xs text-muted mb-1 block">Actual Price ($, optional)</label>
              <input type="number" value={form.actualAmount} onChange={(e) => setForm({ ...form, actualAmount: e.target.value })}
                placeholder="12500" className="w-full px-3 py-2 text-sm rounded border border-border bg-background" />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted mb-1 block">Supplier (optional)</label>
            <input type="text" value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded border border-border bg-background" />
          </div>
          <button onClick={handleAdd} disabled={saving || !form.itemName || !form.contractAmount}
            className="px-4 py-2 text-sm font-medium rounded bg-primary text-white hover:opacity-90 disabled:opacity-50">
            {saving ? "Saving..." : "Add Allowance"}
          </button>
        </div>
      )}

      {/* Allowance List */}
      {allowances.length === 0 ? (
        <p className="text-sm text-muted text-center py-4">No allowances tracked yet. Add your first PC or PS item.</p>
      ) : (
        <div className="space-y-2">
          {allowances.map((a) => {
            const diff = a.actual_amount !== null ? Number(a.actual_amount) - Number(a.contract_amount) : null;
            return (
              <div key={a.id} className="card py-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{a.item_name}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-muted/10 uppercase">{a.allowance_type}</span>
                      <span className="text-xs text-muted">{a.category}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-muted">Allowance: <strong>${Number(a.contract_amount).toLocaleString()}</strong></span>
                      {a.actual_amount !== null ? (
                        <>
                          <span>Actual: <strong>${Number(a.actual_amount).toLocaleString()}</strong></span>
                          <span className={`font-medium ${diff! > 0 ? "text-red-600" : "text-green-600"}`}>
                            {diff! > 0 ? "+" : ""}{diff === 0 ? "On target" : `$${diff!.toLocaleString()}`}
                          </span>
                        </>
                      ) : (
                        <input
                          type="number"
                          placeholder="Enter actual $"
                          onBlur={(e) => e.target.value && updateActual(a.id, e.target.value)}
                          className="w-28 px-2 py-1 text-xs rounded border border-border bg-background"
                        />
                      )}
                    </div>
                    {a.supplier && <p className="text-xs text-muted mt-1">Supplier: {a.supplier}</p>}
                  </div>
                  <button onClick={() => deleteAllowance(a.id)}
                    className="text-xs text-muted hover:text-red-600 px-1">×</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
