"use client";

import { useState } from "react";

type Status = "idle" | "submitting" | "success" | "error";

export default function RedFlagsSignupForm() {
    const [firstName, setFirstName] = useState("");
    const [email, setEmail] = useState("");
    const [state, setState] = useState("");
    const [status, setStatus] = useState<Status>("idle");
    const [message, setMessage] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.includes("@")) {
            setStatus("error");
            setMessage("Please enter a valid email address.");
            return;
        }

        setStatus("submitting");
        setMessage("");

        try {
            const res = await fetch("/api/red-flags/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: email.trim().toLowerCase(),
                    firstName: firstName.trim() || null,
                    state: state || null,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setStatus("error");
                setMessage(data.error || "Something went wrong. Please try again.");
                return;
            }

            setStatus("success");
            setMessage(data.alreadySubscribed
                ? "You're already on the list — check your inbox for the PDF."
                : "Check your inbox in the next 60 seconds for your free PDF."
            );
            setEmail("");
            setFirstName("");
            setState("");
        } catch {
            setStatus("error");
            setMessage("Network error. Please try again.");
        }
    };

    if (status === "success") {
        return (
            <div className="text-center py-4">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">PDF on its way</h3>
                <p className="text-muted-foreground">{message}</p>
                <p className="text-xs text-muted-foreground mt-4">
                    Tip: check your spam folder if it doesn&apos;t arrive in 5 minutes.
                </p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <h2 className="text-2xl font-bold mb-1">Get the free PDF</h2>
                <p className="text-sm text-muted-foreground mb-4">Delivered to your inbox in under a minute.</p>
            </div>

            <div>
                <label htmlFor="firstName" className="block text-sm font-medium mb-1">
                    First name <span className="text-muted-foreground font-normal">(optional)</span>
                </label>
                <input
                    type="text"
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    disabled={status === "submitting"}
                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="Sarah"
                    autoComplete="given-name"
                />
            </div>

            <div>
                <label htmlFor="email" className="block text-sm font-medium mb-1">
                    Email address <span className="text-red-500">*</span>
                </label>
                <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={status === "submitting"}
                    required
                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="you@example.com"
                    autoComplete="email"
                />
            </div>

            <div>
                <label htmlFor="state" className="block text-sm font-medium mb-1">
                    Your state <span className="text-muted-foreground font-normal">(optional, helps us send you state-specific tips)</span>
                </label>
                <select
                    id="state"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    disabled={status === "submitting"}
                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                    <option value="">— Select state —</option>
                    <option value="NSW">New South Wales</option>
                    <option value="VIC">Victoria</option>
                    <option value="QLD">Queensland</option>
                    <option value="WA">Western Australia</option>
                    <option value="SA">South Australia</option>
                    <option value="TAS">Tasmania</option>
                    <option value="ACT">Australian Capital Territory</option>
                    <option value="NT">Northern Territory</option>
                </select>
            </div>

            {status === "error" && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">
                    {message}
                </div>
            )}

            <button
                type="submit"
                disabled={status === "submitting"}
                className="w-full py-3 px-4 rounded-lg bg-teal-600 hover:bg-teal-700 active:bg-teal-800 disabled:bg-teal-400 text-white font-bold transition-colors"
            >
                {status === "submitting" ? "Sending PDF..." : "Email me the PDF"}
            </button>

            <p className="text-xs text-muted-foreground text-center">
                Free forever. No credit card. One-click unsubscribe.
            </p>
        </form>
    );
}
