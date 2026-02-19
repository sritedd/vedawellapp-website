"use client";

import australianData from "@/data/australian-build-workflows.json";

interface RedFlagsCheckerProps {
    phase: "preContract" | "duringConstruction" | "atHandover";
}

export default function RedFlagsChecker({ phase }: RedFlagsCheckerProps) {
    const flags = australianData.redFlags[phase] || [];

    const phaseLabels = {
        preContract: { title: "Before Signing Contract", icon: "📝" },
        duringConstruction: { title: "During Construction", icon: "🏗️" },
        atHandover: { title: "At Handover", icon: "🔑" },
    };

    const severityStyles = {
        critical: "bg-red-100 border-red-300 text-red-800",
        high: "bg-orange-100 border-orange-300 text-orange-800",
        medium: "bg-amber-100 border-amber-300 text-amber-800",
    };

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
                <span>{phaseLabels[phase].icon}</span>
                <span>{phaseLabels[phase].title}</span>
            </h3>

            <div className="space-y-3">
                {flags.map((flag: any, idx: number) => (
                    <div
                        key={idx}
                        className={`p-4 rounded-lg border ${severityStyles[flag.severity as keyof typeof severityStyles]
                            }`}
                    >
                        <div className="flex items-start gap-3">
                            <span className="text-xl">
                                {flag.severity === "critical" ? "🚨" : "⚠️"}
                            </span>
                            <div className="flex-1">
                                <p className="font-medium">{flag.warning}</p>
                                <div className="mt-2 text-sm flex items-start gap-2">
                                    <span className="font-bold">Action:</span>
                                    <span>{flag.action}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
