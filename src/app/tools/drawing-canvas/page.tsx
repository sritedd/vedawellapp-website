"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

export default function DrawingCanvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState("#ffffff");
    const [brushSize, setBrushSize] = useState(5);
    const [tool, setTool] = useState<"pen" | "eraser">("pen");

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.fillStyle = "#1e293b";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }, []);

    const startDrawing = (e: React.MouseEvent) => {
        setIsDrawing(true);
        draw(e);
    };

    const stopDrawing = () => setIsDrawing(false);

    const draw = (e: React.MouseEvent) => {
        if (!isDrawing || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        ctx.lineWidth = brushSize;
        ctx.lineCap = "round";
        ctx.strokeStyle = tool === "eraser" ? "#1e293b" : color;
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y);
    };

    const clear = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.fillStyle = "#1e293b";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    const download = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const a = document.createElement("a");
        a.href = canvas.toDataURL("image/png");
        a.download = `drawing-${Date.now()}.png`;
        a.click();
    };

    const colors = ["#ffffff", "#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899"];

    return (
        <div className="min-h-screen bg-slate-900">
            <nav className="border-b border-slate-700 bg-slate-900/80 backdrop-blur sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Link href="/tools" className="text-slate-400 hover:text-white">← Back</Link>
                        <h1 className="text-xl font-bold text-white">✏️ Drawing Canvas</h1>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={clear} className="px-4 py-2 bg-slate-700 text-white rounded-lg text-sm">Clear</button>
                        <button onClick={download} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">Save</button>
                    </div>
                </div>
            </nav>
            <main className="max-w-6xl mx-auto p-6">
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 mb-4 flex items-center gap-4 flex-wrap">
                    <div className="flex gap-1">
                        {colors.map(c => (
                            <button key={c} onClick={() => setColor(c)} className={`w-8 h-8 rounded-full ${color === c ? "ring-2 ring-white ring-offset-2 ring-offset-slate-800" : ""}`} style={{ backgroundColor: c }} />
                        ))}
                        <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer" />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-slate-400 text-sm">Size:</span>
                        <input type="range" value={brushSize} onChange={(e) => setBrushSize(parseInt(e.target.value))} min="1" max="50" className="w-24" />
                        <span className="text-white text-sm w-8">{brushSize}</span>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setTool("pen")} className={`px-3 py-1 rounded ${tool === "pen" ? "bg-blue-600 text-white" : "bg-slate-700 text-slate-300"}`}>✏️ Pen</button>
                        <button onClick={() => setTool("eraser")} className={`px-3 py-1 rounded ${tool === "eraser" ? "bg-blue-600 text-white" : "bg-slate-700 text-slate-300"}`}>🧹 Eraser</button>
                    </div>
                </div>
                <canvas ref={canvasRef} width={1000} height={600} onMouseDown={startDrawing} onMouseUp={stopDrawing} onMouseOut={stopDrawing} onMouseMove={draw} className="w-full rounded-xl border border-slate-700 cursor-crosshair" />
            </main>
        </div>
    );
}
