"use client";

import { useState } from "react";
import checklistData from "@/data/homeowner-checklists.json";
import { useToast } from "@/components/guardian/Toast";

interface QuestionBankProps {
    currentStage?: string;
}

const STAGES = [
    { id: "pre-construction", label: "Pre-Construction", icon: "📋" },
    { id: "slab", label: "Slab/Base", icon: "🏗️" },
    { id: "frame", label: "Frame", icon: "🪵" },
    { id: "lockup", label: "Lockup/Enclosed", icon: "🏠" },
    { id: "pre-plasterboard", label: "Pre-Plasterboard", icon: "🔧" },
    { id: "fixing", label: "Fixing", icon: "🔨" },
    { id: "practical-completion", label: "Practical Completion", icon: "✅" },
];

export default function QuestionBank({ currentStage }: QuestionBankProps) {
    const { toast } = useToast();
    const [selectedStage, setSelectedStage] = useState(currentStage || "pre-construction");
    const [askedQuestions, setAskedQuestions] = useState<Set<string>>(new Set());

    const questions = checklistData.questionsByStage[selectedStage as keyof typeof checklistData.questionsByStage] || [];

    const toggleAsked = (question: string) => {
        const newAsked = new Set(askedQuestions);
        if (newAsked.has(question)) {
            newAsked.delete(question);
        } else {
            newAsked.add(question);
        }
        setAskedQuestions(newAsked);
    };

    const copyAllQuestions = () => {
        const text = questions.join("\n• ");
        navigator.clipboard.writeText(`Questions to ask your builder:\n\n• ${text}`);
        toast("Questions copied to clipboard!", "success");
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold">❓ Question Bank</h2>
                    <p className="text-muted-foreground">
                        Key questions to ask your builder at each stage.
                    </p>
                </div>
                <button
                    onClick={copyAllQuestions}
                    className="px-4 py-2 bg-primary text-white rounded-lg text-sm"
                >
                    📋 Copy All Questions
                </button>
            </div>

            {/* Stage Selector */}
            <div className="flex flex-wrap gap-2">
                {STAGES.map((stage) => (
                    <button
                        key={stage.id}
                        onClick={() => setSelectedStage(stage.id)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedStage === stage.id
                                ? "bg-primary text-white"
                                : "bg-muted/20 hover:bg-muted/40"
                            }`}
                    >
                        {stage.icon} {stage.label}
                    </button>
                ))}
            </div>

            {/* Questions List */}
            <div className="space-y-3">
                {questions.map((question, idx) => (
                    <div
                        key={idx}
                        className={`p-4 rounded-xl border transition-colors cursor-pointer ${askedQuestions.has(question)
                                ? "bg-green-50 border-green-200"
                                : "bg-card border-border hover:border-primary/30"
                            }`}
                        onClick={() => toggleAsked(question)}
                    >
                        <div className="flex items-start gap-3">
                            <span
                                className={`w-6 h-6 flex items-center justify-center rounded-full text-sm ${askedQuestions.has(question)
                                        ? "bg-green-500 text-white"
                                        : "bg-muted/30"
                                    }`}
                            >
                                {askedQuestions.has(question) ? "✓" : idx + 1}
                            </span>
                            <span
                                className={
                                    askedQuestions.has(question)
                                        ? "line-through text-muted-foreground"
                                        : ""
                                }
                            >
                                {question}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Progress */}
            <div className="text-sm text-muted-foreground text-center">
                {askedQuestions.size} of {questions.length} questions asked for this stage
            </div>

            {/* Tips */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <h4 className="font-bold text-blue-800 mb-2">💡 Tips for Asking Questions</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Ask during site visits or scheduled meetings</li>
                    <li>• Always follow up verbal answers with an email summary</li>
                    <li>• Log all responses in your Communication Log</li>
                    <li>• Don't be afraid to ask for clarification</li>
                </ul>
            </div>
        </div>
    );
}
