"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Shield, Camera, FileText, AlertTriangle, CheckCircle, ArrowRight, X } from "lucide-react";

const ONBOARDED_KEY = "guardian-onboarded";

const steps = [
    {
        icon: Shield,
        title: "Welcome to HomeOwner Guardian",
        subtitle: "Your construction watchdog",
        description:
            "Guardian helps Australian homeowners monitor their build, catch defects early, and protect their investment. The average new build has $15,000–$40,000 in defects — most go unnoticed until it's too late.",
        tips: [
            "Track every stage of your build from slab to handover",
            "Log defects with photos and timestamps for legal evidence",
            "Monitor builder compliance with Australian building standards",
        ],
    },
    {
        icon: Camera,
        title: "Document Everything",
        subtitle: "Your evidence library",
        description:
            "Take photos at every visit. Log defects the moment you spot them. Guardian timestamps and organises everything so you have a rock-solid paper trail if things go wrong.",
        tips: [
            "Upload progress photos at each stage inspection",
            "Record defects with location, severity, and photos",
            "Track variations and get digital signatures",
        ],
    },
    {
        icon: FileText,
        title: "Know Your Rights",
        subtitle: "State-specific guidance",
        description:
            "Guardian knows the rules for NSW, VIC, QLD, SA, and WA. We'll tell you what inspections are required, what certificates to demand, and when your builder is cutting corners.",
        tips: [
            "Stage-specific checklists based on your state's regulations",
            "Payment milestone tracking — never pay early",
            "Export reports for Fair Trading, NCAT, or your solicitor",
        ],
    },
];

export default function OnboardingWizard() {
    const [show, setShow] = useState(false);
    const [step, setStep] = useState(0);
    const router = useRouter();

    useEffect(() => {
        if (!localStorage.getItem(ONBOARDED_KEY)) {
            setShow(true);
        }
    }, []);

    if (!show) return null;

    const current = steps[step];
    const Icon = current.icon;
    const isLast = step === steps.length - 1;

    function dismiss() {
        localStorage.setItem(ONBOARDED_KEY, "1");
        setShow(false);
    }

    function next() {
        if (isLast) {
            dismiss();
            router.push("/guardian/projects/new");
        } else {
            setStep(step + 1);
        }
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-primary to-teal-500 p-6 text-white relative">
                    <button
                        onClick={dismiss}
                        className="absolute top-4 right-4 p-1 rounded-lg hover:bg-white/20 transition-colors"
                        aria-label="Skip onboarding"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mb-3">
                        <Icon className="w-6 h-6" />
                    </div>
                    <h2 className="text-xl font-bold">{current.title}</h2>
                    <p className="text-white/80 text-sm mt-1">{current.subtitle}</p>
                </div>

                {/* Body */}
                <div className="p-6">
                    <p className="text-muted text-sm leading-relaxed mb-5">{current.description}</p>

                    <div className="space-y-3">
                        {current.tips.map((tip, i) => (
                            <div key={i} className="flex items-start gap-3">
                                <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                                <span className="text-sm">{tip}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 pb-6 flex items-center justify-between">
                    {/* Step dots */}
                    <div className="flex gap-2">
                        {steps.map((_, i) => (
                            <div
                                key={i}
                                className={`w-2 h-2 rounded-full transition-colors ${i === step ? "bg-primary" : "bg-border"}`}
                            />
                        ))}
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={dismiss}
                            className="text-sm text-muted hover:text-foreground transition-colors"
                        >
                            Skip
                        </button>
                        <button
                            onClick={next}
                            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity"
                        >
                            {isLast ? "Create Your First Project" : "Next"}
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
