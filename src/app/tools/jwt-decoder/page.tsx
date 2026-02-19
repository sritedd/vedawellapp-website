"use client";

import { useState } from "react";
import Link from "next/link";

interface DecodedJWT {
    header: object;
    payload: object;
    signature: string;
    isValid: boolean;
    error?: string;
}

export default function JWTDecoder() {
    const [jwt, setJwt] = useState("");
    const [decoded, setDecoded] = useState<DecodedJWT | null>(null);

    const decodeJWT = (token: string) => {
        if (!token.trim()) {
            setDecoded(null);
            return;
        }

        try {
            const parts = token.split(".");
            if (parts.length !== 3) {
                setDecoded({
                    header: {},
                    payload: {},
                    signature: "",
                    isValid: false,
                    error: "Invalid JWT format. Expected 3 parts separated by dots.",
                });
                return;
            }

            const [headerB64, payloadB64, signature] = parts;

            // Decode Base64URL to JSON
            const decodeBase64URL = (str: string) => {
                // Add padding if needed
                let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
                const padding = base64.length % 4;
                if (padding) {
                    base64 += "=".repeat(4 - padding);
                }
                return JSON.parse(atob(base64));
            };

            const header = decodeBase64URL(headerB64);
            const payload = decodeBase64URL(payloadB64);

            setDecoded({
                header,
                payload,
                signature,
                isValid: true,
            });
        } catch (error) {
            setDecoded({
                header: {},
                payload: {},
                signature: "",
                isValid: false,
                error: "Failed to decode JWT. " + (error as Error).message,
            });
        }
    };

    const formatJSON = (obj: object): string => {
        return JSON.stringify(obj, null, 2);
    };

    const isExpired = (payload: object): boolean => {
        const exp = (payload as { exp?: number }).exp;
        if (!exp) return false;
        return Date.now() > exp * 1000;
    };

    const formatTimestamp = (timestamp: number): string => {
        return new Date(timestamp * 1000).toLocaleString();
    };

    const copySection = (content: string) => {
        navigator.clipboard.writeText(content);
    };

    const sampleJWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE5MTYyMzkwMjIsInJvbGUiOiJhZG1pbiJ9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-900 via-slate-900 to-slate-900">
            {/* Header */}
            <nav className="border-b border-orange-800/50 bg-slate-900/80 backdrop-blur">
                <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Link href="/tools" className="text-orange-400 hover:text-white">
                            ← Back
                        </Link>
                        <h1 className="text-xl font-bold text-white flex items-center gap-2">
                            <span>🎫</span>
                            JWT Decoder
                        </h1>
                    </div>
                    <button
                        onClick={() => {
                            setJwt(sampleJWT);
                            decodeJWT(sampleJWT);
                        }}
                        className="px-4 py-2 bg-orange-600/20 text-orange-400 rounded-lg text-sm hover:bg-orange-600/30"
                    >
                        Load Sample
                    </button>
                </div>
            </nav>

            <main className="max-w-4xl mx-auto p-6">
                {/* Input */}
                <div className="bg-slate-800/50 rounded-xl p-6 border border-orange-800/30 mb-6">
                    <label className="block text-sm text-orange-300 mb-2 font-medium">
                        Paste JWT Token
                    </label>
                    <textarea
                        value={jwt}
                        onChange={(e) => {
                            setJwt(e.target.value);
                            decodeJWT(e.target.value);
                        }}
                        placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                        rows={4}
                        className="w-full px-4 py-3 bg-slate-900 border border-orange-700 rounded-lg text-white font-mono text-sm focus:border-orange-500 focus:outline-none resize-none"
                        spellCheck={false}
                    />
                </div>

                {/* Error */}
                {decoded && !decoded.isValid && (
                    <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4 mb-6 text-red-400">
                        ⚠️ {decoded.error}
                    </div>
                )}

                {/* Results */}
                {decoded && decoded.isValid && (
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Header */}
                        <div className="bg-slate-800/50 rounded-xl p-6 border border-red-500/30">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-medium text-red-400">Header</h3>
                                <button
                                    onClick={() => copySection(formatJSON(decoded.header))}
                                    className="text-xs text-slate-400 hover:text-white"
                                >
                                    Copy
                                </button>
                            </div>
                            <pre className="bg-slate-900 p-4 rounded-lg text-sm font-mono overflow-x-auto text-red-300">
                                {formatJSON(decoded.header)}
                            </pre>
                        </div>

                        {/* Payload */}
                        <div className="bg-slate-800/50 rounded-xl p-6 border border-purple-500/30">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-medium text-purple-400">Payload</h3>
                                <button
                                    onClick={() => copySection(formatJSON(decoded.payload))}
                                    className="text-xs text-slate-400 hover:text-white"
                                >
                                    Copy
                                </button>
                            </div>
                            <pre className="bg-slate-900 p-4 rounded-lg text-sm font-mono overflow-x-auto text-purple-300">
                                {formatJSON(decoded.payload)}
                            </pre>

                            {/* Token Details */}
                            <div className="mt-4 space-y-2 text-sm">
                                {(decoded.payload as { exp?: number }).exp && (
                                    <div className={`flex justify-between p-2 rounded ${isExpired(decoded.payload) ? "bg-red-500/10 text-red-400" : "bg-green-500/10 text-green-400"}`}>
                                        <span>Expires</span>
                                        <span>
                                            {formatTimestamp((decoded.payload as { exp: number }).exp)}
                                            {isExpired(decoded.payload) && " (EXPIRED)"}
                                        </span>
                                    </div>
                                )}
                                {(decoded.payload as { iat?: number }).iat && (
                                    <div className="flex justify-between p-2 bg-slate-900/50 rounded text-slate-400">
                                        <span>Issued At</span>
                                        <span>{formatTimestamp((decoded.payload as { iat: number }).iat)}</span>
                                    </div>
                                )}
                                {(decoded.payload as { nbf?: number }).nbf && (
                                    <div className="flex justify-between p-2 bg-slate-900/50 rounded text-slate-400">
                                        <span>Not Before</span>
                                        <span>{formatTimestamp((decoded.payload as { nbf: number }).nbf)}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Signature */}
                        <div className="md:col-span-2 bg-slate-800/50 rounded-xl p-6 border border-cyan-500/30">
                            <h3 className="text-lg font-medium text-cyan-400 mb-4">Signature</h3>
                            <div className="bg-slate-900 p-4 rounded-lg font-mono text-sm text-cyan-300 break-all">
                                {decoded.signature}
                            </div>
                            <p className="mt-3 text-xs text-slate-500">
                                ⚠️ This tool only decodes JWTs. It cannot verify the signature without the secret key.
                            </p>
                        </div>
                    </div>
                )}

                {/* Info */}
                {!decoded && (
                    <div className="text-center py-12 text-slate-500">
                        <div className="text-6xl mb-4">🔓</div>
                        <p>Paste a JWT token above to decode it</p>
                    </div>
                )}
            </main>
        </div>
    );
}
