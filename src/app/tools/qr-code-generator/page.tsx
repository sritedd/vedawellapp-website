"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

export default function QRCodeGenerator() {
    const [text, setText] = useState("https://vedawell.tools");
    const [size, setSize] = useState(256);
    const [bgColor, setBgColor] = useState("#ffffff");
    const [fgColor, setFgColor] = useState("#000000");
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Simple QR code generation using Google Charts API as fallback
    // In production, you'd use a library like qrcode.js
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}&bgcolor=${bgColor.slice(1)}&color=${fgColor.slice(1)}`;

    const downloadQR = () => {
        const link = document.createElement("a");
        link.href = qrUrl;
        link.download = "qrcode.png";
        link.click();
    };

    const presets = [
        { label: "URL", icon: "🔗", placeholder: "https://example.com" },
        { label: "Email", icon: "📧", placeholder: "mailto:email@example.com" },
        { label: "Phone", icon: "📞", placeholder: "tel:+1234567890" },
        { label: "SMS", icon: "💬", placeholder: "sms:+1234567890?body=Hello" },
        { label: "WiFi", icon: "📶", placeholder: "WIFI:S:NetworkName;T:WPA;P:password;;" },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900">
            {/* Header */}
            <nav className="border-b border-white/10 bg-black/20 backdrop-blur">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <Link href="/" className="flex items-center gap-2 text-xl font-bold text-white">
                        <span>🛠️</span>
                        <span>VedaWell Tools</span>
                    </Link>
                    <Link href="/tools" className="text-white/70 hover:text-white">
                        ← All Tools
                    </Link>
                </div>
            </nav>

            <main className="py-12 px-6">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-3xl font-bold text-white mb-2 text-center">📱 QR Code Generator</h1>
                    <p className="text-white/60 text-center mb-8">
                        Create QR codes for URLs, text, WiFi, and more
                    </p>

                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Input */}
                        <div className="bg-white/10 backdrop-blur rounded-2xl p-6">
                            <h2 className="text-lg font-bold text-white mb-4">Content</h2>

                            {/* Presets */}
                            <div className="flex flex-wrap gap-2 mb-4">
                                {presets.map((preset) => (
                                    <button
                                        key={preset.label}
                                        onClick={() => setText(preset.placeholder)}
                                        className="px-3 py-1.5 bg-white/20 text-white rounded-lg text-sm hover:bg-white/30 transition-colors"
                                    >
                                        {preset.icon} {preset.label}
                                    </button>
                                ))}
                            </div>

                            {/* Text Input */}
                            <textarea
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                placeholder="Enter text or URL..."
                                className="w-full h-32 px-4 py-3 bg-black/30 text-white rounded-xl border border-white/20 focus:border-purple-400 outline-none resize-none"
                            />

                            {/* Options */}
                            <div className="mt-6 space-y-4">
                                <div>
                                    <label className="block text-white/70 text-sm mb-2">Size: {size}px</label>
                                    <input
                                        type="range"
                                        min="128"
                                        max="512"
                                        step="32"
                                        value={size}
                                        onChange={(e) => setSize(parseInt(e.target.value))}
                                        className="w-full"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-white/70 text-sm mb-2">Background</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="color"
                                                value={bgColor}
                                                onChange={(e) => setBgColor(e.target.value)}
                                                className="w-12 h-10 rounded cursor-pointer"
                                            />
                                            <input
                                                type="text"
                                                value={bgColor}
                                                onChange={(e) => setBgColor(e.target.value)}
                                                className="flex-1 px-3 py-2 bg-black/30 text-white rounded-lg border border-white/20 text-sm font-mono"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-white/70 text-sm mb-2">Foreground</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="color"
                                                value={fgColor}
                                                onChange={(e) => setFgColor(e.target.value)}
                                                className="w-12 h-10 rounded cursor-pointer"
                                            />
                                            <input
                                                type="text"
                                                value={fgColor}
                                                onChange={(e) => setFgColor(e.target.value)}
                                                className="flex-1 px-3 py-2 bg-black/30 text-white rounded-lg border border-white/20 text-sm font-mono"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Preview */}
                        <div className="bg-white/10 backdrop-blur rounded-2xl p-6 flex flex-col items-center justify-center">
                            <h2 className="text-lg font-bold text-white mb-4">Preview</h2>

                            <div className="bg-white p-4 rounded-xl">
                                {text ? (
                                    <img
                                        src={qrUrl}
                                        alt="QR Code"
                                        width={size}
                                        height={size}
                                        className="max-w-full"
                                    />
                                ) : (
                                    <div
                                        className="flex items-center justify-center text-gray-400"
                                        style={{ width: size, height: size }}
                                    >
                                        Enter text to generate
                                    </div>
                                )}
                            </div>

                            {text && (
                                <button
                                    onClick={downloadQR}
                                    className="mt-6 px-8 py-3 bg-purple-500 text-white rounded-xl font-medium hover:bg-purple-400 transition-colors"
                                >
                                    ⬇ Download PNG
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Use Cases */}
                    <div className="mt-8 p-6 bg-white/5 rounded-2xl">
                        <h3 className="text-white font-bold mb-4">Common Use Cases</h3>
                        <div className="grid md:grid-cols-3 gap-4 text-sm text-white/70">
                            <div>
                                <span className="font-medium text-white">Website URL</span>
                                <p>Direct visitors to your website or landing page</p>
                            </div>
                            <div>
                                <span className="font-medium text-white">WiFi Network</span>
                                <p>Share WiFi credentials without typing passwords</p>
                            </div>
                            <div>
                                <span className="font-medium text-white">Contact Info</span>
                                <p>Share vCard contact info for easy saving</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
