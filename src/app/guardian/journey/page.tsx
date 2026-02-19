import Link from "next/link";
import StateWorkflowTimeline from "@/components/guardian/StateWorkflowTimeline";
import RedFlagsChecker from "@/components/guardian/RedFlagsChecker";
import australianData from "@/data/australian-build-workflows.json";

export default function JourneyPage({
    searchParams,
}: {
    searchParams: Promise<{ state?: string; type?: string; phase?: string }>;
}) {
    return (
        <JourneyContent searchParams={searchParams} />
    );
}

async function JourneyContent({
    searchParams,
}: {
    searchParams: Promise<{ state?: string; type?: string; phase?: string }>;
}) {
    const params = await searchParams;
    const state = params.state || "NSW";
    const buildType = (params.type || "new_build") as "new_build" | "extension" | "granny_flat";
    const phase = params.phase || "workflow";

    return (
        <div className="min-h-screen flex flex-col bg-background">
            {/* Navigation */}
            <nav className="border-b border-border bg-card">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <Link href="/" className="flex items-center gap-2 text-xl font-bold">
                        <span>🛠️</span>
                        <span>VedaWell Tools</span>
                    </Link>
                    <div className="flex items-center gap-6">
                        <Link href="/guardian/dashboard" className="text-muted hover:text-foreground">
                            Dashboard
                        </Link>
                        <Link href="/guardian/journey" className="font-semibold text-primary">
                            📚 Learn
                        </Link>
                    </div>
                </div>
            </nav>

            <main className="flex-1 py-12 px-6">
                <div className="max-w-5xl mx-auto">
                    <header className="mb-8">
                        <h1 className="text-3xl font-bold mb-2">Build Journey Learning Center</h1>
                        <p className="text-muted-foreground">
                            Everything you need to know about building in Australia.
                        </p>
                    </header>

                    {/* State & Build Type Selector */}
                    <div className="flex flex-wrap gap-4 mb-8 p-4 bg-card border border-border rounded-xl">
                        <div>
                            <label className="text-sm text-muted-foreground block mb-2">State</label>
                            <div className="flex gap-2">
                                {["NSW", "VIC", "QLD", "WA", "SA"].map((s) => (
                                    <Link
                                        key={s}
                                        href={`/guardian/journey?state=${s}&type=${buildType}&phase=${phase}`}
                                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${state === s
                                                ? "bg-primary text-white"
                                                : "bg-muted/20 hover:bg-muted/40"
                                            }`}
                                    >
                                        {s}
                                    </Link>
                                ))}
                            </div>
                        </div>
                        <div className="border-l border-border pl-4">
                            <label className="text-sm text-muted-foreground block mb-2">Build Type</label>
                            <div className="flex gap-2">
                                {australianData.buildCategories.map((cat) => (
                                    <Link
                                        key={cat.id}
                                        href={`/guardian/journey?state=${state}&type=${cat.id}&phase=${phase}`}
                                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${buildType === cat.id
                                                ? "bg-primary text-white"
                                                : "bg-muted/20 hover:bg-muted/40"
                                            }`}
                                    >
                                        <span>{cat.icon}</span>
                                        <span className="hidden sm:inline">{cat.name.split(" ")[0]}</span>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Phase Tabs */}
                    <div className="flex gap-2 mb-8 border-b border-border pb-4">
                        {[
                            { id: "workflow", label: "Construction Stages", icon: "🏗️" },
                            { id: "redflags", label: "Red Flags", icon: "🚨" },
                            { id: "insurance", label: "Insurance & Rights", icon: "🛡️" },
                        ].map((tab) => (
                            <Link
                                key={tab.id}
                                href={`/guardian/journey?state=${state}&type=${buildType}&phase=${tab.id}`}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${phase === tab.id
                                        ? "bg-primary/10 text-primary"
                                        : "hover:bg-muted/20"
                                    }`}
                            >
                                <span>{tab.icon}</span>
                                {tab.label}
                            </Link>
                        ))}
                    </div>

                    {/* Content */}
                    {phase === "workflow" && (
                        <StateWorkflowTimeline buildCategory={buildType} state={state} />
                    )}

                    {phase === "redflags" && (
                        <div className="space-y-8">
                            <RedFlagsChecker phase="preContract" />
                            <RedFlagsChecker phase="duringConstruction" />
                            <RedFlagsChecker phase="atHandover" />
                        </div>
                    )}

                    {phase === "insurance" && (
                        <InsuranceInfo state={state} />
                    )}
                </div>
            </main>

            <footer className="border-t border-border py-8 px-6 text-center text-muted">
                <p>© 2026 VedaWell Tools. Free & Open Source.</p>
            </footer>
        </div>
    );
}

function InsuranceInfo({ state }: { state: string }) {
    const stateData = australianData.states.find((s) => s.code === state);
    const links = (australianData.usefulLinks as Record<string, Record<string, string>>)[state] || {};

    if (!stateData) return null;

    return (
        <div className="space-y-8">
            <div className="grid md:grid-cols-2 gap-6">
                {/* Insurance Card */}
                <div className="p-6 bg-blue-50 border border-blue-200 rounded-xl">
                    <h3 className="text-xl font-bold text-blue-800 mb-4">
                        🛡️ {stateData.insuranceScheme}
                    </h3>
                    <div className="space-y-3">
                        <div className="flex justify-between py-2 border-b border-blue-200">
                            <span className="text-blue-700">Mandatory Threshold</span>
                            <span className="font-bold">${stateData.insuranceThreshold.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-blue-200">
                            <span className="text-blue-700">Structural Defects</span>
                            <span className="font-bold">{stateData.warrantyPeriods.structural} years</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-blue-200">
                            <span className="text-blue-700">Non-Structural Defects</span>
                            <span className="font-bold">{stateData.warrantyPeriods.nonStructural} years</span>
                        </div>
                        {"maxCoverage" in stateData && (
                            <div className="flex justify-between py-2 border-b border-blue-200">
                                <span className="text-blue-700">Max Coverage</span>
                                <span className="font-bold">${(stateData as any).maxCoverage.toLocaleString()}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Regulator Card */}
                <div className="p-6 bg-card border border-border rounded-xl">
                    <h3 className="text-xl font-bold mb-4">📋 Regulator</h3>
                    <div className="space-y-3">
                        <p className="text-lg font-medium">{stateData.regulator}</p>
                        <a
                            href={stateData.regulatorUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block px-4 py-2 bg-primary text-white rounded-lg text-sm"
                        >
                            Visit Website →
                        </a>
                    </div>
                </div>
            </div>

            {/* Useful Links */}
            {Object.keys(links).length > 0 && (
                <div className="p-6 bg-card border border-border rounded-xl">
                    <h3 className="text-xl font-bold mb-4">🔗 Useful Links for {state}</h3>
                    <div className="grid md:grid-cols-2 gap-3">
                        {Object.entries(links).map(([key, url]) => (
                            <a
                                key={key}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 p-3 bg-muted/10 hover:bg-muted/20 rounded-lg transition-colors"
                            >
                                <span>→</span>
                                <span className="capitalize">
                                    {key.replace(/([A-Z])/g, " $1").trim()}
                                </span>
                            </a>
                        ))}
                    </div>
                </div>
            )}

            {/* Your Rights */}
            <div className="p-6 bg-amber-50 border border-amber-200 rounded-xl">
                <h3 className="text-xl font-bold text-amber-800 mb-4">⚖️ Your Rights as a Homeowner</h3>
                <ul className="space-y-2 text-amber-900">
                    <li className="flex items-start gap-2">
                        <span>✓</span>
                        <span>
                            <strong>Cooling-off period:</strong> 5 business days to cancel contract in {state} (check state-specific rules)
                        </span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span>✓</span>
                        <span>
                            <strong>Insurance before work:</strong> Builder must provide valid home warranty insurance BEFORE work starts
                        </span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span>✓</span>
                        <span>
                            <strong>Progress payments:</strong> Cannot be demanded without completed work and certificates
                        </span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span>✓</span>
                        <span>
                            <strong>Defect rectification:</strong> {stateData.warrantyPeriods.nonStructural} years for non-structural, {stateData.warrantyPeriods.structural} years for structural
                        </span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span>✓</span>
                        <span>
                            <strong>Dispute resolution:</strong> Free mediation available through Fair Trading / DBDRV before NCAT/VCAT
                        </span>
                    </li>
                </ul>
            </div>
        </div>
    );
}
