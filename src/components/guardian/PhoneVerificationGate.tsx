"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface Props {
    onVerified: () => void;
}

export default function PhoneVerificationGate({ onVerified }: Props) {
    const [step, setStep] = useState<"checking" | "enter-phone" | "enter-code" | "verified">("checking");
    const [phone, setPhone] = useState("");
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [countdown, setCountdown] = useState(0);

    // Check if phone is already verified
    useEffect(() => {
        async function check() {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: profile } = await supabase
                .from("profiles")
                .select("phone, phone_verified, is_admin, subscription_tier")
                .eq("id", user.id)
                .single();

            // Admins and Pro users skip phone verification
            if (profile?.is_admin || profile?.subscription_tier === "guardian_pro") {
                setStep("verified");
                onVerified();
                return;
            }

            if (profile?.phone_verified) {
                setStep("verified");
                onVerified();
            } else if (profile?.phone) {
                setPhone(profile.phone);
                setStep("enter-phone");
            } else {
                setStep("enter-phone");
            }
        }
        check();
    }, [onVerified]);

    // Countdown timer for resend
    useEffect(() => {
        if (countdown <= 0) return;
        const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
        return () => clearInterval(timer);
    }, [countdown]);

    const handleSendOTP = async () => {
        if (!phone.trim()) {
            setMessage({ type: "error", text: "Please enter your phone number." });
            return;
        }
        setLoading(true);
        setMessage(null);

        try {
            const res = await fetch("/api/guardian/phone-verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "send", phone: phone.trim() }),
            });
            const data = await res.json();

            if (!res.ok) {
                setMessage({ type: "error", text: data.error || "Failed to send code" });
            } else {
                setMessage({ type: "success", text: data.message });
                setStep("enter-code");
                setCountdown(60);
            }
        } catch {
            setMessage({ type: "error", text: "Network error. Please try again." });
        }
        setLoading(false);
    };

    const handleVerifyOTP = async () => {
        if (!code.trim()) {
            setMessage({ type: "error", text: "Please enter the 6-digit code." });
            return;
        }
        setLoading(true);
        setMessage(null);

        try {
            const res = await fetch("/api/guardian/phone-verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "verify", code: code.trim() }),
            });
            const data = await res.json();

            if (!res.ok) {
                setMessage({ type: "error", text: data.error || "Verification failed" });
            } else {
                setMessage({ type: "success", text: "Phone verified!" });
                setStep("verified");
                setTimeout(() => onVerified(), 1000);
            }
        } catch {
            setMessage({ type: "error", text: "Network error. Please try again." });
        }
        setLoading(false);
    };

    if (step === "checking") {
        return (
            <div className="flex items-center justify-center py-12">
                <span className="inline-block w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    if (step === "verified") return null;

    return (
        <div className="bg-card border border-border rounded-xl p-8 shadow-sm max-w-md mx-auto">
            <div className="text-center mb-6">
                <div className="text-4xl mb-3">📱</div>
                <h2 className="text-xl font-bold">Verify Your Phone</h2>
                <p className="text-muted text-sm mt-2">
                    We need to verify your phone number before you can create a project.
                    This helps prevent duplicate accounts and keeps the platform fair for everyone.
                </p>
            </div>

            {step === "enter-phone" && (
                <div className="space-y-4">
                    <div>
                        <label htmlFor="verify-phone" className="block text-sm font-medium mb-2">
                            Australian Mobile Number
                        </label>
                        <input
                            id="verify-phone"
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="0400 000 000"
                        />
                        <p className="text-xs text-muted mt-1">
                            A verification code will be sent to your email for this phone number.
                        </p>
                    </div>
                    <button
                        onClick={handleSendOTP}
                        disabled={loading || !phone.trim()}
                        className="btn-primary w-full disabled:opacity-50"
                    >
                        {loading ? "Sending..." : "Send Verification Code"}
                    </button>
                </div>
            )}

            {step === "enter-code" && (
                <div className="space-y-4">
                    <p className="text-sm text-center text-muted">
                        Enter the 6-digit code sent to your email for phone <strong>{phone}</strong>
                    </p>
                    <div>
                        <input
                            type="text"
                            value={code}
                            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                            className="w-full px-4 py-4 rounded-lg border border-border bg-background text-center text-2xl tracking-[0.5em] font-mono focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="000000"
                            maxLength={6}
                            autoFocus
                        />
                    </div>
                    <button
                        onClick={handleVerifyOTP}
                        disabled={loading || code.length !== 6}
                        className="btn-primary w-full disabled:opacity-50"
                    >
                        {loading ? "Verifying..." : "Verify Code"}
                    </button>
                    <div className="flex items-center justify-between text-sm">
                        <button
                            onClick={() => { setStep("enter-phone"); setCode(""); setMessage(null); }}
                            className="text-primary hover:underline"
                        >
                            Change number
                        </button>
                        <button
                            onClick={handleSendOTP}
                            disabled={countdown > 0 || loading}
                            className="text-primary hover:underline disabled:text-muted disabled:no-underline"
                        >
                            {countdown > 0 ? `Resend in ${countdown}s` : "Resend code"}
                        </button>
                    </div>
                </div>
            )}

            {message && (
                <div className={`mt-4 p-3 rounded-lg text-sm ${
                    message.type === "error"
                        ? "bg-danger/10 text-danger border border-danger/20"
                        : "bg-success/10 text-success border border-success/20"
                }`}>
                    {message.text}
                </div>
            )}
        </div>
    );
}
