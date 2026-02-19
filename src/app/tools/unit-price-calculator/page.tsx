"use client";

import { useState } from "react";
import Link from "next/link";

interface Item {
    name: string;
    price: number;
    quantity: number;
    unit: string;
}

export default function UnitPriceCalculator() {
    const [items, setItems] = useState<Item[]>([
        { name: "Product A", price: 5.99, quantity: 500, unit: "g" },
        { name: "Product B", price: 4.49, quantity: 350, unit: "g" },
    ]);

    const addItem = () => setItems([...items, { name: `Product ${items.length + 1}`, price: 0, quantity: 0, unit: "g" }]);
    const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));
    const updateItem = (i: number, field: keyof Item, value: string | number) => {
        const updated = [...items];
        updated[i] = { ...updated[i], [field]: value };
        setItems(updated);
    };

    const calculateUnitPrice = (item: Item) => {
        if (item.quantity <= 0) return 0;
        return item.price / item.quantity;
    };

    const sorted = [...items].sort((a, b) => calculateUnitPrice(a) - calculateUnitPrice(b));
    const cheapestIndex = items.length > 1 ? items.indexOf(sorted[0]) : -1;

    return (
        <div className="min-h-screen bg-gradient-to-br from-lime-900 via-slate-900 to-slate-900">
            <nav className="border-b border-lime-800/50 bg-slate-900/80 backdrop-blur">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
                    <Link href="/tools" className="text-lime-400 hover:text-white">← Back</Link>
                    <h1 className="text-xl font-bold text-white">💰 Unit Price Calculator</h1>
                </div>
            </nav>
            <main className="max-w-4xl mx-auto p-6">
                <div className="space-y-4">
                    {items.map((item, i) => (
                        <div key={i} className={`bg-slate-800/50 rounded-xl p-6 border ${cheapestIndex === i ? "border-green-500 ring-2 ring-green-500/30" : "border-lime-800/30"}`}>
                            {cheapestIndex === i && <div className="text-green-400 text-sm font-medium mb-2">🏆 Best Value!</div>}
                            <div className="grid md:grid-cols-5 gap-4 items-end">
                                <div className="md:col-span-1">
                                    <label className="block text-xs text-lime-300 mb-1">Name</label>
                                    <input type="text" value={item.name} onChange={(e) => updateItem(i, "name", e.target.value)} className="w-full px-3 py-2 bg-slate-900 border border-lime-700 rounded text-white" />
                                </div>
                                <div>
                                    <label className="block text-xs text-lime-300 mb-1">Price ($)</label>
                                    <input type="number" value={item.price || ""} onChange={(e) => updateItem(i, "price", parseFloat(e.target.value) || 0)} step="0.01" className="w-full px-3 py-2 bg-slate-900 border border-lime-700 rounded text-white" />
                                </div>
                                <div>
                                    <label className="block text-xs text-lime-300 mb-1">Quantity</label>
                                    <input type="number" value={item.quantity || ""} onChange={(e) => updateItem(i, "quantity", parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 bg-slate-900 border border-lime-700 rounded text-white" />
                                </div>
                                <div>
                                    <label className="block text-xs text-lime-300 mb-1">Unit</label>
                                    <select value={item.unit} onChange={(e) => updateItem(i, "unit", e.target.value)} className="w-full px-3 py-2 bg-slate-900 border border-lime-700 rounded text-white">
                                        <option value="g">grams (g)</option>
                                        <option value="kg">kilograms (kg)</option>
                                        <option value="ml">milliliters (ml)</option>
                                        <option value="L">liters (L)</option>
                                        <option value="oz">ounces (oz)</option>
                                        <option value="lb">pounds (lb)</option>
                                        <option value="pcs">pieces</option>
                                    </select>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 text-center py-2 bg-slate-900 rounded">
                                        <div className="text-xs text-slate-400">Per {item.unit}</div>
                                        <div className="text-lg font-bold text-lime-400">${calculateUnitPrice(item).toFixed(4)}</div>
                                    </div>
                                    {items.length > 1 && <button onClick={() => removeItem(i)} className="text-red-400 hover:text-red-300 p-2">✕</button>}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                <button onClick={addItem} className="mt-4 w-full py-3 bg-lime-600 text-white rounded-lg font-medium hover:bg-lime-700">+ Add Product</button>
            </main>
        </div>
    );
}
