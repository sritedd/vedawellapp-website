"use client";

import { useState } from "react";
import australianData from "@/data/australian-build-workflows.json";

interface BuildTypeSelectorProps {
    onSelect: (category: string, state: string) => void;
    selectedCategory?: string;
    selectedState?: string;
}

export default function BuildTypeSelector({
    onSelect,
    selectedCategory,
    selectedState,
}: BuildTypeSelectorProps) {
    const [category, setCategory] = useState(selectedCategory || "");
    const [state, setState] = useState(selectedState || "NSW");

    const handleCategorySelect = (id: string) => {
        setCategory(id);
        if (state) onSelect(id, state);
    };

    const handleStateSelect = (code: string) => {
        setState(code);
        if (category) onSelect(category, code);
    };

    return (
        <div className="space-y-8">
            {/* State Selector */}
            <div>
                <label className="block text-sm font-medium text-muted-foreground mb-3">
                    1. Select your state
                </label>
                <div className="flex flex-wrap gap-2">
                    {australianData.states.map((s) => (
                        <button
                            key={s.code}
                            onClick={() => handleStateSelect(s.code)}
                            className={`px-4 py-2 rounded-lg border-2 transition-all font-medium ${state === s.code
                                    ? "border-primary bg-primary/10 text-primary"
                                    : "border-border hover:border-primary/50"
                                }`}
                        >
                            {s.code}
                        </button>
                    ))}
                </div>
                {state && (
                    <div className="mt-3 text-sm text-muted-foreground">
                        Regulator:{" "}
                        <a
                            href={australianData.states.find((s) => s.code === state)?.regulatorUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                        >
                            {australianData.states.find((s) => s.code === state)?.regulator}
                        </a>
                    </div>
                )}
            </div>

            {/* Build Type Cards */}
            <div>
                <label className="block text-sm font-medium text-muted-foreground mb-3">
                    2. What type of build is this?
                </label>
                <div className="grid md:grid-cols-3 gap-4">
                    {australianData.buildCategories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => handleCategorySelect(cat.id)}
                            className={`p-6 rounded-xl border-2 text-left transition-all ${category === cat.id
                                    ? "border-primary bg-primary/5 shadow-lg"
                                    : "border-border hover:border-primary/50 hover:shadow-md"
                                }`}
                        >
                            <span className="text-4xl mb-3 block">{cat.icon}</span>
                            <h3 className="font-bold text-lg mb-1">{cat.name}</h3>
                            <p className="text-sm text-muted-foreground">{cat.description}</p>

                            {/* Show approval pathway summary */}
                            {category === cat.id && state && (
                                <div className="mt-4 pt-4 border-t border-border">
                                    <div className="text-xs text-muted-foreground">
                                        {cat.id === "granny_flat" && state === "NSW" && (
                                            <>
                                                ✓ Up to 60sqm on 450sqm+ lot
                                                <br />✓ CDC possible in 10-20 days
                                            </>
                                        )}
                                        {cat.id === "new_build" && state === "NSW" && (
                                            <>
                                                ✓ CDC: 10-20 days (if compliant)
                                                <br />✓ DA: 8-20 weeks (if needed)
                                            </>
                                        )}
                                        {cat.id === "extension" && state === "NSW" && (
                                            <>
                                                ✓ CDC for simple extensions
                                                <br />✓ DA for 2nd storey / heritage
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Insurance Info */}
            {state && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-bold text-blue-800 mb-2">
                        🛡️ {australianData.states.find((s) => s.code === state)?.insuranceScheme}
                    </h4>
                    <p className="text-sm text-blue-700">
                        Mandatory for work over{" "}
                        <strong>
                            ${australianData.states.find((s) => s.code === state)?.insuranceThreshold?.toLocaleString()}
                        </strong>
                        . Warranty: {australianData.states.find((s) => s.code === state)?.warrantyPeriods?.structural} years structural,{" "}
                        {australianData.states.find((s) => s.code === state)?.warrantyPeriods?.nonStructural} years non-structural.
                    </p>
                </div>
            )}
        </div>
    );
}
