"use client";

import { useState } from "react";
import Link from "next/link";

export default function ScientificCalculator() {
    const [display, setDisplay] = useState("0");
    const [memory, setMemory] = useState(0);
    const [isRad, setIsRad] = useState(true);

    const append = (val: string) => setDisplay(display === "0" ? val : display + val);
    const clear = () => setDisplay("0");
    const backspace = () => setDisplay(display.length > 1 ? display.slice(0, -1) : "0");

    const calculate = () => {
        try {
            let expr = display.replace(/×/g, "*").replace(/÷/g, "/").replace(/π/g, "Math.PI").replace(/e(?![x])/g, "Math.E");
            expr = expr.replace(/sin\(/g, isRad ? "Math.sin(" : "Math.sin(Math.PI/180*");
            expr = expr.replace(/cos\(/g, isRad ? "Math.cos(" : "Math.cos(Math.PI/180*");
            expr = expr.replace(/tan\(/g, isRad ? "Math.tan(" : "Math.tan(Math.PI/180*");
            expr = expr.replace(/log\(/g, "Math.log10(").replace(/ln\(/g, "Math.log(");
            expr = expr.replace(/sqrt\(/g, "Math.sqrt(").replace(/\^/g, "**");
            expr = expr.replace(/abs\(/g, "Math.abs(").replace(/exp\(/g, "Math.exp(");
            const result = eval(expr);
            setDisplay(String(result));
        } catch { setDisplay("Error"); }
    };

    const btns = [
        ["sin(", "cos(", "tan(", "π", "C"],
        ["log(", "ln(", "sqrt(", "^", "⌫"],
        ["7", "8", "9", "÷", "("],
        ["4", "5", "6", "×", ")"],
        ["1", "2", "3", "-", "M+"],
        ["0", ".", "=", "+", "MR"],
    ];

    const handleBtn = (btn: string) => {
        if (btn === "C") clear();
        else if (btn === "⌫") backspace();
        else if (btn === "=") calculate();
        else if (btn === "M+") setMemory(memory + (parseFloat(display) || 0));
        else if (btn === "MR") setDisplay(String(memory));
        else append(btn);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-6">
            <div className="w-full max-w-sm">
                <Link href="/tools" className="text-slate-400 hover:text-white text-sm mb-4 inline-block">← Back to Tools</Link>
                <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-slate-400 text-xs">🧮 Scientific Calculator</span>
                        <button onClick={() => setIsRad(!isRad)} className="text-xs px-2 py-1 bg-slate-700 text-white rounded">{isRad ? "RAD" : "DEG"}</button>
                    </div>
                    <div className="bg-slate-900 rounded-lg p-4 mb-4 text-right text-3xl font-mono text-white overflow-x-auto">{display}</div>
                    <div className="grid grid-cols-5 gap-2">
                        {btns.flat().map((btn) => (
                            <button key={btn} onClick={() => handleBtn(btn)} className={`p-3 rounded-lg font-medium text-lg ${btn === "=" ? "bg-blue-600 text-white hover:bg-blue-700" : btn.match(/[0-9.]/) ? "bg-slate-700 text-white hover:bg-slate-600" : "bg-slate-600 text-slate-200 hover:bg-slate-500"}`}>{btn}</button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
