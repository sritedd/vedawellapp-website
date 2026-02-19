"use client";

import { useState } from "react";
import Link from "next/link";

const UNITS = {
    length: {
        name: "Length",
        units: [
            { id: "m", name: "Meters", factor: 1 },
            { id: "km", name: "Kilometers", factor: 1000 },
            { id: "cm", name: "Centimeters", factor: 0.01 },
            { id: "mm", name: "Millimeters", factor: 0.001 },
            { id: "mi", name: "Miles", factor: 1609.344 },
            { id: "yd", name: "Yards", factor: 0.9144 },
            { id: "ft", name: "Feet", factor: 0.3048 },
            { id: "in", name: "Inches", factor: 0.0254 },
        ],
    },
    weight: {
        name: "Weight",
        units: [
            { id: "kg", name: "Kilograms", factor: 1 },
            { id: "g", name: "Grams", factor: 0.001 },
            { id: "mg", name: "Milligrams", factor: 0.000001 },
            { id: "lb", name: "Pounds", factor: 0.453592 },
            { id: "oz", name: "Ounces", factor: 0.0283495 },
            { id: "st", name: "Stones", factor: 6.35029 },
        ],
    },
    temperature: {
        name: "Temperature",
        units: [
            { id: "c", name: "Celsius", factor: 1 },
            { id: "f", name: "Fahrenheit", factor: 1 },
            { id: "k", name: "Kelvin", factor: 1 },
        ],
    },
    volume: {
        name: "Volume",
        units: [
            { id: "l", name: "Liters", factor: 1 },
            { id: "ml", name: "Milliliters", factor: 0.001 },
            { id: "gal", name: "Gallons (US)", factor: 3.78541 },
            { id: "qt", name: "Quarts", factor: 0.946353 },
            { id: "pt", name: "Pints", factor: 0.473176 },
            { id: "cup", name: "Cups", factor: 0.236588 },
            { id: "floz", name: "Fluid Ounces", factor: 0.0295735 },
        ],
    },
    area: {
        name: "Area",
        units: [
            { id: "sqm", name: "Square Meters", factor: 1 },
            { id: "sqkm", name: "Square Kilometers", factor: 1000000 },
            { id: "sqft", name: "Square Feet", factor: 0.092903 },
            { id: "sqmi", name: "Square Miles", factor: 2589988.11 },
            { id: "ac", name: "Acres", factor: 4046.86 },
            { id: "ha", name: "Hectares", factor: 10000 },
        ],
    },
};

type Category = keyof typeof UNITS;

export default function UnitConverter() {
    const [category, setCategory] = useState<Category>("length");
    const [fromUnit, setFromUnit] = useState("m");
    const [toUnit, setToUnit] = useState("ft");
    const [fromValue, setFromValue] = useState("");
    const [result, setResult] = useState<number | null>(null);

    const convert = (value: string) => {
        setFromValue(value);
        const num = parseFloat(value);
        if (isNaN(num)) {
            setResult(null);
            return;
        }

        if (category === "temperature") {
            // Special handling for temperature
            let celsius: number;
            if (fromUnit === "c") celsius = num;
            else if (fromUnit === "f") celsius = (num - 32) * 5 / 9;
            else celsius = num - 273.15; // kelvin

            let converted: number;
            if (toUnit === "c") converted = celsius;
            else if (toUnit === "f") converted = celsius * 9 / 5 + 32;
            else converted = celsius + 273.15; // kelvin

            setResult(Math.round(converted * 10000) / 10000);
        } else {
            const fromFactor = UNITS[category].units.find(u => u.id === fromUnit)?.factor || 1;
            const toFactor = UNITS[category].units.find(u => u.id === toUnit)?.factor || 1;
            const baseValue = num * fromFactor;
            const converted = baseValue / toFactor;
            setResult(Math.round(converted * 10000) / 10000);
        }
    };

    const swapUnits = () => {
        setFromUnit(toUnit);
        setToUnit(fromUnit);
        if (result !== null) {
            setFromValue(result.toString());
            convert(result.toString());
        }
    };

    const changeCategory = (newCategory: Category) => {
        setCategory(newCategory);
        setFromUnit(UNITS[newCategory].units[0].id);
        setToUnit(UNITS[newCategory].units[1].id);
        setFromValue("");
        setResult(null);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            {/* Header */}
            <nav className="border-b border-border bg-white/80 backdrop-blur">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <Link href="/" className="flex items-center gap-2 text-xl font-bold">
                        <span>🛠️</span>
                        <span>VedaWell Tools</span>
                    </Link>
                    <Link href="/tools" className="text-gray-600 hover:text-gray-900">
                        ← All Tools
                    </Link>
                </div>
            </nav>

            <main className="py-12 px-6">
                <div className="max-w-lg mx-auto">
                    <div className="bg-white rounded-2xl shadow-xl p-8">
                        <h1 className="text-3xl font-bold mb-2 text-center">📏 Unit Converter</h1>
                        <p className="text-gray-500 text-center mb-8">
                            Convert between different units of measurement
                        </p>

                        {/* Category Selector */}
                        <div className="flex flex-wrap justify-center gap-2 mb-8">
                            {(Object.keys(UNITS) as Category[]).map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => changeCategory(cat)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${category === cat
                                            ? "bg-indigo-500 text-white"
                                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                        }`}
                                >
                                    {UNITS[cat].name}
                                </button>
                            ))}
                        </div>

                        {/* Converter */}
                        <div className="space-y-4">
                            {/* From */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">From</label>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        value={fromValue}
                                        onChange={(e) => convert(e.target.value)}
                                        placeholder="Enter value"
                                        className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-lg"
                                    />
                                    <select
                                        value={fromUnit}
                                        onChange={(e) => {
                                            setFromUnit(e.target.value);
                                            convert(fromValue);
                                        }}
                                        className="px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 outline-none bg-white"
                                    >
                                        {UNITS[category].units.map((unit) => (
                                            <option key={unit.id} value={unit.id}>
                                                {unit.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Swap Button */}
                            <div className="flex justify-center">
                                <button
                                    onClick={swapUnits}
                                    className="p-3 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                                >
                                    ⇅
                                </button>
                            </div>

                            {/* To */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
                                <div className="flex gap-2">
                                    <div className="flex-1 px-4 py-3 rounded-xl bg-indigo-50 border border-indigo-200 text-lg font-medium text-indigo-900">
                                        {result !== null ? result.toLocaleString() : "—"}
                                    </div>
                                    <select
                                        value={toUnit}
                                        onChange={(e) => {
                                            setToUnit(e.target.value);
                                            convert(fromValue);
                                        }}
                                        className="px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 outline-none bg-white"
                                    >
                                        {UNITS[category].units.map((unit) => (
                                            <option key={unit.id} value={unit.id}>
                                                {unit.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Formula */}
                        {result !== null && fromValue && (
                            <div className="mt-6 p-4 bg-gray-50 rounded-xl text-center text-gray-600">
                                {fromValue} {UNITS[category].units.find(u => u.id === fromUnit)?.name} = {result.toLocaleString()} {UNITS[category].units.find(u => u.id === toUnit)?.name}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
