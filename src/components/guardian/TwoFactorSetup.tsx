"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

type MfaStatus = "loading" | "disabled" | "enrolling" | "verifying" | "enabled";

export default function TwoFactorSetup() {
  const [status, setStatus] = useState<MfaStatus>("loading");
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [error, setError] = useState("");
  const [factorId, setFactorId] = useState("");

  const supabase = createClient();

  useEffect(() => {
    checkMfaStatus();
  }, []);

  const checkMfaStatus = async () => {
    try {
      const { data } = await supabase.auth.mfa.listFactors();
      const totpFactors = data?.totp || [];
      const verified = totpFactors.find((f: { status: string }) => f.status === "verified");

      if (verified) {
        setStatus("enabled");
        setFactorId(verified.id);
      } else {
        setStatus("disabled");
      }
    } catch {
      setStatus("disabled");
    }
  };

  const startEnroll = async () => {
    setError("");
    setStatus("enrolling");

    try {
      const { data, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Guardian Authenticator",
      });

      if (enrollError) throw enrollError;

      if (data) {
        setQrCode(data.totp.qr_code);
        setSecret(data.totp.secret);
        setFactorId(data.id);
        setStatus("verifying");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start enrollment");
      setStatus("disabled");
    }
  };

  const verifyEnroll = async () => {
    if (verifyCode.length !== 6) {
      setError("Enter the 6-digit code from your authenticator app");
      return;
    }

    setError("");

    try {
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId,
      });

      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.id,
        code: verifyCode,
      });

      if (verifyError) throw verifyError;

      // Update profile
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("profiles").update({
          mfa_enabled: true,
          mfa_verified_at: new Date().toISOString(),
        }).eq("id", user.id);
      }

      setStatus("enabled");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed. Check the code and try again.");
    }
  };

  const disableMfa = async () => {
    if (!confirm("Are you sure you want to disable two-factor authentication? This makes your account less secure.")) return;

    try {
      await supabase.auth.mfa.unenroll({ factorId });

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("profiles").update({
          mfa_enabled: false,
          mfa_verified_at: null,
        }).eq("id", user.id);
      }

      setStatus("disabled");
      setFactorId("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to disable 2FA");
    }
  };

  if (status === "loading") {
    return <div className="flex justify-center py-4"><div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-sm">Two-Factor Authentication</h3>
          <p className="text-xs text-muted mt-0.5">
            Add an extra layer of security with an authenticator app.
          </p>
        </div>
        {status === "enabled" && (
          <span className="text-xs px-2 py-1 bg-green-500/10 text-green-700 rounded-full font-medium">Enabled</span>
        )}
      </div>

      {status === "disabled" && (
        <button onClick={startEnroll}
          className="px-4 py-2 text-sm font-medium rounded bg-primary text-white hover:opacity-90">
          Enable 2FA
        </button>
      )}

      {status === "verifying" && (
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-sm mb-3">Scan this QR code with your authenticator app:</p>
            {qrCode && (
              <img src={qrCode} alt="2FA QR Code" className="mx-auto w-48 h-48 border rounded" />
            )}
            <p className="text-xs text-muted mt-2">
              Or enter manually: <code className="bg-muted/10 px-1 rounded text-xs">{secret}</code>
            </p>
          </div>

          <div>
            <label className="text-xs text-muted mb-1 block">Enter 6-digit verification code:</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                className="flex-1 px-3 py-2 text-sm rounded border border-border bg-background text-center tracking-widest font-mono"
              />
              <button onClick={verifyEnroll}
                className="px-4 py-2 text-sm font-medium rounded bg-primary text-white hover:opacity-90">
                Verify
              </button>
            </div>
          </div>
        </div>
      )}

      {status === "enabled" && (
        <button onClick={disableMfa}
          className="text-xs text-muted hover:text-red-600 transition-colors">
          Disable 2FA
        </button>
      )}

      {error && <p className="text-sm text-red-600 bg-red-500/10 px-3 py-2 rounded">{error}</p>}
    </div>
  );
}
