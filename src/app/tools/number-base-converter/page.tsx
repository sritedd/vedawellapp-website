"use client";

import { useState } from "react";
import Link from "next/link";

export default function NumberBaseConverter() {
    const [decimal, setDecimal] = useState("");
    const [binary, setBinary] = useState("");
    const [hex, setHex] = useState("");
    const [octal, setOctal] = useState("");

    const fromDecimal = (val: string) => {
        const n = parseInt(val) || 0;
        setDecimal(val);
        setBinary(n.toString(2));
        setHex(n.toString(16).toUpperCase());
        setOctal(n.toString(8));
    };

    const fromBinary = (val: string) => {
        setBinary(val);
        const n = parseInt(val, 2) || 0;
        setDecimal(n.toString());
        setHex(n.toString(16).toUpperCase());
        setOctal(n.toString(8));
    };

    const fromHex = (val: string) => {
        setHex(val);
        const n = parseInt(val, 16) || 0;
        setDecimal(n.toString());
        setBinary(n.toString(2));
        setOctal(n.toString(8));
    };

    const fromOctal = (val: string) => {
        setOctal(val);
        const n = parseInt(val, 8) || 0;
        setDecimal(n.toString());
        setBinary(n.toString(2));
        setHex(n.toString(16).toUpperCase());
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-900 via-slate-900 to-slate-900">
            <nav className="border-b border-blue-800/50 bg-slate-900/80 backdrop-blur">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
                    <Link href="/tools" className="text-blue-400 hover:text-white">← Back</Link>
                    <h1 className="text-xl font-bold text-white">🔢 Number Base Converter</h1>
                </div>
            </nav>
            <main className="max-w-4xl mx-auto p-6 grid md:grid-cols-2 gap-4">
                {[
                    { label: "Decimal (Base 10)", value: decimal, onChange: fromDecimal, color: "blue" },
                    { label: "Binary (Base 2)", value: binary, onChange: fromBinary, color: "green" },
                    { label: "Hexadecimal (Base 16)", value: hex, onChange: fromHex, color: "purple" },
                    { label: "Octal (Base 8)", value: octal, onChange: fromOctal, color: "orange" },
                ].map(({ label, value, onChange, color }) => (
                    <div key={label} className={`bg-slate-800/50 rounded-xl p-6 border border-${color}-800/30`}>
                        <label className={`block text-sm text-${color}-300 mb-2`}>{label}</label>
                        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className={`w-full px-4 py-3 bg-slate-900 border border-${color}-700 rounded-lg text-white font-mono text-lg focus:outline-none`} />
                    </div>
                ))}
            </main>
        </div>
    );
}
