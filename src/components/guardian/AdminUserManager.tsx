"use client";

import { useState } from "react";
import { grantTrial, revokeTrial, setUserTier, bypassPhoneVerification, resetPhoneVerification, clearUserPhone } from "@/app/guardian/actions";

export default function AdminUserManager() {
    const [email, setEmail] = useState("");
    const [days, setDays] = useState(14);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const handleGrantTrial = async () => {
        if (!email.trim()) return;
        setLoading(true);
        setResult(null);
        const res = await grantTrial(email.trim(), days);
        if (res.error) {
            setResult({ type: "error", text: res.error });
        } else {
            setResult({ type: "success", text: `Trial granted to ${email} for ${days} days (ends ${new Date(res.trialEnd!).toLocaleDateString("en-AU")})` });
            setEmail("");
        }
        setLoading(false);
    };

    const handleRevokeTrial = async () => {
        if (!email.trim()) return;
        setLoading(true);
        setResult(null);
        const res = await revokeTrial(email.trim());
        if (res.error) {
            setResult({ type: "error", text: res.error });
        } else {
            setResult({ type: "success", text: `Trial revoked for ${email} — set to free tier` });
            setEmail("");
        }
        setLoading(false);
    };

    const handleSetPro = async () => {
        if (!email.trim()) return;
        setLoading(true);
        setResult(null);
        const res = await setUserTier(email.trim(), "guardian_pro");
        if (res.error) {
            setResult({ type: "error", text: res.error });
        } else {
            setResult({ type: "success", text: `${email} upgraded to Guardian Pro` });
            setEmail("");
        }
        setLoading(false);
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="flex-1 px-4 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                />
                <div className="flex items-center gap-2">
                    <label className="text-sm text-muted whitespace-nowrap">Trial days:</label>
                    <select
                        value={days}
                        onChange={(e) => setDays(Number(e.target.value))}
                        className="px-3 py-2.5 rounded-lg border border-border bg-background text-sm"
                    >
                        <option value={7}>7 days</option>
                        <option value={14}>14 days</option>
                        <option value={30}>30 days</option>
                        <option value={60}>60 days</option>
                        <option value={90}>90 days</option>
                    </select>
                </div>
            </div>

            <div className="flex flex-wrap gap-2">
                <button
                    onClick={handleGrantTrial}
                    disabled={loading || !email.trim()}
                    className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                    Grant Free Trial
                </button>
                <button
                    onClick={handleRevokeTrial}
                    disabled={loading || !email.trim()}
                    className="px-4 py-2 text-sm font-medium rounded-lg bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50 transition-colors"
                >
                    Revoke Trial
                </button>
                <button
                    onClick={handleSetPro}
                    disabled={loading || !email.trim()}
                    className="px-4 py-2 text-sm font-medium rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                    Set as Pro
                </button>
            </div>

            {/* Phone verification management */}
            <div className="pt-3 border-t border-border">
                <p className="text-xs text-muted mb-2 font-medium">Phone Verification</p>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={async () => {
                            if (!email.trim()) return;
                            setLoading(true); setResult(null);
                            const res = await bypassPhoneVerification(email.trim());
                            setResult(res.error ? { type: "error", text: res.error } : { type: "success", text: `Phone verification bypassed for ${email}` });
                            setLoading(false);
                        }}
                        disabled={loading || !email.trim()}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50 transition-colors"
                    >
                        Bypass Phone OTP
                    </button>
                    <button
                        onClick={async () => {
                            if (!email.trim()) return;
                            setLoading(true); setResult(null);
                            const res = await resetPhoneVerification(email.trim());
                            setResult(res.error ? { type: "error", text: res.error } : { type: "success", text: `Phone verification reset for ${email} — must re-verify` });
                            setLoading(false);
                        }}
                        disabled={loading || !email.trim()}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-yellow-600 text-white hover:bg-yellow-700 disabled:opacity-50 transition-colors"
                    >
                        Reset Phone Verify
                    </button>
                    <button
                        onClick={async () => {
                            if (!email.trim()) return;
                            setLoading(true); setResult(null);
                            const res = await clearUserPhone(email.trim());
                            setResult(res.error ? { type: "error", text: res.error } : { type: "success", text: `Phone cleared for ${email} — can register new number` });
                            setLoading(false);
                        }}
                        disabled={loading || !email.trim()}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                    >
                        Clear Phone Number
                    </button>
                </div>
            </div>

            {result && (
                <div className={`p-3 rounded-lg text-sm ${
                    result.type === "error"
                        ? "bg-red-500/10 text-red-600 border border-red-500/20"
                        : "bg-green-500/10 text-green-600 border border-green-500/20"
                }`}>
                    {result.text}
                </div>
            )}
        </div>
    );
}
