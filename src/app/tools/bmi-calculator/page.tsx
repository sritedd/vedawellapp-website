"use client";

import { useState, useEffect } from "react";
import ToolLayout from "@/components/tools/ToolLayout";

export default function BMICalculator() {
    const [unit, setUnit] = useState<'metric' | 'imperial'>('metric');

    // Inputs
    const [heightCm, setHeightCm] = useState(170);
    const [weightKg, setWeightKg] = useState(70);
    const [heightFt, setHeightFt] = useState(5);
    const [heightIn, setHeightIn] = useState(7);
    const [weightLbs, setWeightLbs] = useState(154);

    // Results
    const [bmi, setBmi] = useState(0);
    const [label, setLabel] = useState("");
    const [color, setColor] = useState("");
    const [rotation, setRotation] = useState(-90);
    const [tip, setTip] = useState("");
    const [idealWeight, setIdealWeight] = useState("");

    const calculate = () => {
        let calculatedBmi = 0;
        let h_meters = 0;

        if (unit === 'metric') {
            if (!heightCm || !weightKg) return;
            h_meters = heightCm / 100;
            calculatedBmi = weightKg / (h_meters * h_meters);
        } else {
            if ((!heightFt && !heightIn) || !weightLbs) return;
            const heightInches = (Number(heightFt) * 12) + Number(heightIn);
            calculatedBmi = (weightLbs / (heightInches * heightInches)) * 703;
            h_meters = heightInches * 0.0254;
        }

        setBmi(calculatedBmi);

        // Categories
        if (calculatedBmi < 18.5) {
            setLabel("Underweight");
            setColor("text-blue-500");
            setRotation(-90 + (Math.max(calculatedBmi, 15) - 15) / (18.5 - 15) * 45);
            setTip("In Ayurveda, low weight may indicate elevated Vata. Focus on warm, nourishing foods like soups, stews, grains, and root vegetables using ghee or healthy oils to build grounding energy.");
        } else if (calculatedBmi < 25) {
            setLabel("Normal Weight");
            setColor("text-green-500");
            setRotation(-45 + (calculatedBmi - 18.5) / (25 - 18.5) * 45);
            setTip("Great balance! This suggests good Ojas (vitality). Maintain your health by eating seasonal foods and following a daily routine (Dinacharya) that aligns with nature's rhythm.");
        } else if (calculatedBmi < 30) {
            setLabel("Overweight");
            setColor("text-yellow-500");
            setRotation(0 + (calculatedBmi - 25) / (30 - 25) * 45);
            setTip("Excess weight often links to Kapha accumulation. Prioritize light, warm, and spicy foods. Avoid heavy, oily, or cold foods. Regular vigorous exercise helps stimulate metabolism (Agni).");
        } else {
            setLabel("Obese");
            setColor("text-red-500");
            setRotation(45 + (Math.min(calculatedBmi, 40) - 30) / (40 - 30) * 45);
            setTip("This may indicate a significant Kapha imbalance or slow metabolism. Focus on 'Langhana' (lightening) therapies: warm water, ginger tea, bitter/astringent foods (leafy greens), and active movement.");
        }

        // Ideal Weight
        const minWeight = 18.5 * h_meters * h_meters;
        const maxWeight = 24.9 * h_meters * h_meters;

        if (unit === 'metric') {
            setIdealWeight(`${minWeight.toFixed(1)} kg - ${maxWeight.toFixed(1)} kg`);
        } else {
            const minLbs = minWeight * 2.20462;
            const maxLbs = maxWeight * 2.20462;
            setIdealWeight(`${minLbs.toFixed(1)} lbs - ${maxLbs.toFixed(1)} lbs`);
        }
    };

    useEffect(() => {
        calculate();
    }, [unit, heightCm, weightKg, heightFt, heightIn, weightLbs]);

    return (
        <ToolLayout
            title="BMI Health Insight"
            description="Calculate your Body Mass Index (BMI) and discover your ideal weight range combined with Ayurvedic wellness tips."
        >
            <div className="grid lg:grid-cols-2 gap-12 items-start">
                {/* Input Section */}
                <div className="bg-muted/5 p-6 rounded-xl border border-border">
                    {/* Toggle */}
                    <div className="flex bg-muted p-1 rounded-lg mb-8">
                        <button
                            onClick={() => setUnit('metric')}
                            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${unit === 'metric'
                                    ? 'bg-card shadow-sm text-foreground'
                                    : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            Metric (kg/cm)
                        </button>
                        <button
                            onClick={() => setUnit('imperial')}
                            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${unit === 'imperial'
                                    ? 'bg-card shadow-sm text-foreground'
                                    : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            Imperial (lbs/ft)
                        </button>
                    </div>

                    {unit === 'metric' ? (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-2">Height (cm)</label>
                                <input
                                    type="number"
                                    value={heightCm}
                                    onChange={(e) => setHeightCm(Number(e.target.value))}
                                    className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-2">Weight (kg)</label>
                                <input
                                    type="number"
                                    value={weightKg}
                                    onChange={(e) => setWeightKg(Number(e.target.value))}
                                    className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-2">Height</label>
                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <input
                                            type="number"
                                            value={heightFt}
                                            onChange={(e) => setHeightFt(Number(e.target.value))}
                                            placeholder="ft"
                                            className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <input
                                            type="number"
                                            value={heightIn}
                                            onChange={(e) => setHeightIn(Number(e.target.value))}
                                            placeholder="in"
                                            className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-2">Weight (lbs)</label>
                                <input
                                    type="number"
                                    value={weightLbs}
                                    onChange={(e) => setWeightLbs(Number(e.target.value))}
                                    className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>
                        </div>
                    )}

                    <div className="mt-8 p-4 bg-primary/5 rounded-lg border border-primary/10 text-sm text-muted">
                        ℹ️ BMI is a screening tool. For a full health assessment, please consult a medical professional.
                    </div>
                </div>

                {/* Results Section */}
                <div className="bg-card rounded-xl">
                    {/* Gauge Visualization */}
                    <div className="relative w-[280px] h-[140px] mx-auto mb-8 overflow-hidden">
                        <div
                            className="w-full h-full rounded-t-[140px]"
                            style={{
                                background: `conic-gradient(from 180deg, #3b82f6 0deg 45deg, #22c55e 45deg 90deg, #eab308 90deg 135deg, #ef4444 135deg 180deg)`,
                                mask: 'radial-gradient(transparent 90px, black 91px)',
                                WebkitMask: 'radial-gradient(transparent 90px, black 91px)'
                            }}
                        />
                        {/* Needle */}
                        <div
                            className="absolute bottom-0 left-1/2 w-1 h-[130px] bg-foreground origin-bottom rounded-full transition-transform duration-1000 ease-out"
                            style={{ transform: `translateX(-50%) rotate(${Math.min(Math.max(rotation, -90), 90)}deg)` }}
                        />
                        {/* Center Dot */}
                        <div className="absolute bottom-[-10px] left-1/2 w-5 h-5 bg-foreground rounded-full -translate-x-1/2" />
                    </div>

                    <div className="text-center mb-8">
                        <div className={`text-6xl font-extrabold mb-2 ${color}`}>
                            {bmi.toFixed(1)}
                        </div>
                        <div className={`text-xl font-semibold ${color}`}>
                            {label}
                        </div>
                    </div>

                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-center mb-8">
                        <h4 className="text-primary text-xs uppercase tracking-wider font-bold mb-2">Target Healthy Range</h4>
                        <div className="text-xl font-bold">{idealWeight}</div>
                    </div>

                    <div className="border-t border-border pt-8">
                        <h3 className="flex items-center gap-2 text-lg font-semibold mb-3">
                            🌿 Ayurvedic Insight
                        </h3>
                        <p className="text-muted leading-relaxed">
                            {tip}
                        </p>
                    </div>
                </div>
            </div>
        </ToolLayout>
    );
}
