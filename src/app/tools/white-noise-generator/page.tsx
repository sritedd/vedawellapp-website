"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

const NOISE_TYPES = [
    { id: "white", name: "White Noise", color: "from-gray-400 to-gray-500" },
    { id: "pink", name: "Pink Noise", color: "from-pink-400 to-pink-500" },
    { id: "brown", name: "Brown Noise", color: "from-amber-700 to-amber-800" },
    { id: "rain", name: "Rain", color: "from-blue-400 to-blue-500" },
];

export default function WhiteNoiseGenerator() {
    const [isPlaying, setIsPlaying] = useState(false);
    const [noiseType, setNoiseType] = useState("white");
    const [volume, setVolume] = useState(50);
    const audioContextRef = useRef<AudioContext | null>(null);
    const noiseNodeRef = useRef<AudioBufferSourceNode | null>(null);
    const gainNodeRef = useRef<GainNode | null>(null);

    const generateNoise = (type: string, sampleRate: number): Float32Array => {
        const bufferSize = 2 * sampleRate;
        const noiseBuffer = new Float32Array(bufferSize);
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            if (type === "white") {
                noiseBuffer[i] = white;
            } else if (type === "pink") {
                b0 = 0.99886 * b0 + white * 0.0555179;
                b1 = 0.99332 * b1 + white * 0.0750759;
                b2 = 0.96900 * b2 + white * 0.1538520;
                b3 = 0.86650 * b3 + white * 0.3104856;
                b4 = 0.55000 * b4 + white * 0.5329522;
                b5 = -0.7616 * b5 - white * 0.0168980;
                noiseBuffer[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
                b6 = white * 0.115926;
            } else if (type === "brown") {
                noiseBuffer[i] = (b6 + (0.02 * white)) / 1.02;
                b6 = noiseBuffer[i];
                noiseBuffer[i] *= 3.5;
            } else if (type === "rain") {
                noiseBuffer[i] = white * (Math.sin(i * 0.0001) * 0.3 + 0.7);
            }
        }
        return noiseBuffer;
    };

    const startNoise = () => {
        if (!audioContextRef.current) audioContextRef.current = new AudioContext();
        const ctx = audioContextRef.current;
        const noiseData = generateNoise(noiseType, ctx.sampleRate);
        const buffer = ctx.createBuffer(1, noiseData.length, ctx.sampleRate);
        buffer.getChannelData(0).set(noiseData);
        noiseNodeRef.current = ctx.createBufferSource();
        noiseNodeRef.current.buffer = buffer;
        noiseNodeRef.current.loop = true;
        gainNodeRef.current = ctx.createGain();
        gainNodeRef.current.gain.value = volume / 100;
        noiseNodeRef.current.connect(gainNodeRef.current);
        gainNodeRef.current.connect(ctx.destination);
        noiseNodeRef.current.start();
        setIsPlaying(true);
    };

    const stopNoise = () => {
        noiseNodeRef.current?.stop();
        noiseNodeRef.current?.disconnect();
        setIsPlaying(false);
    };

    useEffect(() => {
        if (gainNodeRef.current) gainNodeRef.current.gain.value = volume / 100;
    }, [volume]);

    useEffect(() => {
        if (isPlaying) { stopNoise(); startNoise(); }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [noiseType]);

    const currentNoise = NOISE_TYPES.find(n => n.id === noiseType)!;

    return (
        <div className={`min-h-screen bg-gradient-to-br ${currentNoise.color} to-slate-900`}>
            <nav className="border-b border-white/20 bg-black/20 backdrop-blur">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
                    <Link href="/tools" className="text-white/70 hover:text-white">← Back</Link>
                    <h1 className="text-xl font-bold text-white">🔉 White Noise Generator</h1>
                </div>
            </nav>
            <main className="max-w-md mx-auto p-6 text-center">
                <div className="bg-white/10 rounded-2xl p-8 backdrop-blur mb-6">
                    <div className="text-6xl mb-4">{isPlaying ? "🔊" : "🔇"}</div>
                    <div className="text-2xl font-bold text-white mb-6">{currentNoise.name}</div>
                    <button onClick={isPlaying ? stopNoise : startNoise} className={`px-12 py-4 rounded-full font-medium text-lg ${isPlaying ? "bg-red-600 text-white" : "bg-white text-slate-900"}`}>
                        {isPlaying ? "Stop" : "Play"}
                    </button>
                </div>
                <div className="bg-white/10 rounded-xl p-6 backdrop-blur mb-6">
                    <label className="block text-sm text-white/70 mb-2">Volume: {volume}%</label>
                    <input type="range" value={volume} onChange={(e) => setVolume(parseInt(e.target.value))} min="0" max="100" className="w-full" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    {NOISE_TYPES.map(n => (
                        <button key={n.id} onClick={() => setNoiseType(n.id)} className={`p-4 rounded-xl font-medium ${noiseType === n.id ? "bg-white text-slate-900" : "bg-white/20 text-white"}`}>{n.name}</button>
                    ))}
                </div>
            </main>
        </div>
    );
}
