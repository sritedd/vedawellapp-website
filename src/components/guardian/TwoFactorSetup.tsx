"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

type MfaStatus = "loading" | "disabled" | "enrolling" | "verifying" | "enabled" | "disabling";

export default function TwoFactorSetup() {
  const [status, setStatus] = useState<MfaStatus>("loading");
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [error, setError] = useState("");
  const [factorId, setFactorId] = useState("");

  // Disable 2FA form state
  const [disableMethod, setDisableMethod] = useState<"code" | "password">("code");
  const [disableCode, setDisableCode] = useState("");
  const [disablePassword, setDisablePassword] = useState("");
  const [disabling, setDisabling] = useState(false);

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

  const showDisableForm = () => {
    setError("");
    setDisableCode("");
    setDisablePassword("");
    setDisableMethod("code");
    setStatus("disabling");
  };

  const cancelDisable = () => {
    setError("");
    setDisableCode("");
    setDisablePassword("");
    setStatus("enabled");
  };

  const confirmDisable = async () => {
    setError("");

    if (disableMethod === "code" && (disableCode.length !== 6 || !/^\d{6}$/.test(disableCode))) {
      setError("Enter a valid 6-digit authenticator code");
      return;
    }
    if (disableMethod === "password" && !disablePassword.trim()) {
      setError("Enter your account password");
      return;
    }

    setDisabling(true);

    try {
      const body = disableMethod === "code"
        ? { code: disableCode }
        : { password: disablePassword };

      const res = await fetch("/api/guardian/disable-mfa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to disable 2FA");
      }

      setStatus("disabled");
      setFactorId("");
      setDisableCode("");
      setDisablePassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to disable 2FA");
    } finally {
      setDisabling(false);
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
        {(status === "enabled" || status === "disabling") && (
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
        <button onClick={showDisableForm}
          className="text-xs text-muted hover:text-red-600 transition-colors">
          Disable 2FA
        </button>
      )}

      {status === "disabling" && (
        <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-lg space-y-4">
          <p className="text-sm font-medium text-red-700">
            Confirm your identity to disable 2FA
          </p>

          {/* Method toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => { setDisableMethod("code"); setError(""); }}
              className={`flex-1 text-xs py-2 rounded font-medium transition-colors ${
                disableMethod === "code"
                  ? "bg-primary text-white"
                  : "bg-muted/10 text-muted hover:bg-muted/20"
              }`}
            >
              Authenticator Code
            </button>
            <button
              onClick={() => { setDisableMethod("password"); setError(""); }}
              className={`flex-1 text-xs py-2 rounded font-medium transition-colors ${
                disableMethod === "password"
                  ? "bg-primary text-white"
                  : "bg-muted/10 text-muted hover:bg-muted/20"
              }`}
            >
              Account Password
            </button>
          </div>

          {disableMethod === "code" ? (
            <input
              type="text"
              value={disableCode}
              onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              maxLength={6}
              className="w-full px-3 py-2 text-sm rounded border border-border bg-background text-center tracking-widest font-mono"
            />
          ) : (
            <input
              type="password"
              value={disablePassword}
              onChange={(e) => setDisablePassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full px-3 py-2 text-sm rounded border border-border bg-background"
            />
          )}

          <div className="flex gap-2">
            <button
              onClick={confirmDisable}
              disabled={disabling}
              className="px-4 py-2 text-sm font-medium rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
            >
              {disabling ? "Disabling..." : "Disable 2FA"}
            </button>
            <button
              onClick={cancelDisable}
              className="px-4 py-2 text-sm font-medium rounded border border-border hover:bg-muted/10"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-600 bg-red-500/10 px-3 py-2 rounded">{error}</p>}
    </div>
  );
}
