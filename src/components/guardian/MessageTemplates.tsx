"use client";

import { useState } from "react";
import checklistData from "@/data/homeowner-checklists.json";

interface MessageTemplatesProps {
    builderName?: string;
    projectAddress?: string;
}

const TEMPLATE_CATEGORIES = [
    { id: "requestUpdate", label: "Request Update", icon: "📊" },
    { id: "variationConcern", label: "Variation Concern", icon: "💰" },
    { id: "defectNotification", label: "Defect Notification", icon: "🔧" },
    { id: "paymentQuery", label: "Payment Query", icon: "💳" },
    { id: "siteVisitRequest", label: "Site Visit Request", icon: "🏗️" },
    { id: "escalationNotice", label: "Escalation Notice", icon: "⚠️" },
];

type TemplateKey = keyof typeof checklistData.messageTemplates;

export default function MessageTemplates({
    builderName = "[BUILDER NAME]",
    projectAddress = "[PROJECT ADDRESS]",
}: MessageTemplatesProps) {
    const [selectedTemplate, setSelectedTemplate] = useState<TemplateKey>("requestUpdate");
    const [editedBody, setEditedBody] = useState("");
    const [copied, setCopied] = useState(false);

    const template = checklistData.messageTemplates[selectedTemplate];

    const processedBody = (template.body || "")
        .replace(/\[BUILDER NAME\]/g, builderName)
        .replace(/\[PROJECT ADDRESS\]/g, projectAddress)
        .replace(/\[YOUR NAME\]/g, "[YOUR NAME]")
        .replace(/\[YOUR PHONE\]/g, "[YOUR PHONE]")
        .replace(/\[DATE\]/g, new Date().toLocaleDateString());

    const processedSubject = (template.subject || "")
        .replace(/\[PROJECT ADDRESS\]/g, projectAddress);

    const copyToClipboard = () => {
        const text = `Subject: ${processedSubject}\n\n${editedBody || processedBody}`;
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const selectTemplate = (key: TemplateKey) => {
        setSelectedTemplate(key);
        setEditedBody("");
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold">📧 Message Templates</h2>
                <p className="text-muted-foreground">
                    Professional pre-written messages for common situations.
                </p>
            </div>

            {/* Template Selector */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {TEMPLATE_CATEGORIES.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => selectTemplate(cat.id as TemplateKey)}
                        className={`p-4 rounded-xl border text-left transition-colors ${selectedTemplate === cat.id
                                ? "bg-primary/10 border-primary"
                                : "bg-card border-border hover:border-primary/30"
                            }`}
                    >
                        <span className="text-2xl">{cat.icon}</span>
                        <div className="font-medium mt-2">{cat.label}</div>
                    </button>
                ))}
            </div>

            {/* Template Preview/Editor */}
            <div className="p-6 bg-card border border-border rounded-xl space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Subject</label>
                    <input
                        type="text"
                        value={processedSubject}
                        readOnly
                        className="w-full px-4 py-2 border border-border rounded-lg bg-muted/10"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Message Body</label>
                    <textarea
                        value={editedBody || processedBody}
                        onChange={(e) => setEditedBody(e.target.value)}
                        rows={12}
                        className="w-full px-4 py-2 border border-border rounded-lg bg-background font-mono text-sm"
                    />
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={copyToClipboard}
                        className={`px-6 py-3 rounded-lg font-medium transition-colors ${copied
                                ? "bg-green-500 text-white"
                                : "bg-primary text-white hover:bg-primary/90"
                            }`}
                    >
                        {copied ? "✓ Copied!" : "📋 Copy to Clipboard"}
                    </button>
                    <button
                        onClick={() => setEditedBody("")}
                        className="px-6 py-3 bg-muted/20 rounded-lg"
                    >
                        Reset Template
                    </button>
                </div>
            </div>

            {/* Placeholders Guide */}
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <h4 className="font-bold text-amber-800 mb-2">📝 Customize Before Sending</h4>
                <p className="text-sm text-amber-700 mb-2">
                    Replace the following placeholders with your specific details:
                </p>
                <ul className="text-sm text-amber-700 space-y-1 font-mono">
                    <li>• [YOUR NAME] - Your full name</li>
                    <li>• [YOUR PHONE] - Your contact number</li>
                    <li>• [VARIATION NUMBER] - Specific variation reference</li>
                    <li>• [VARIATION DESCRIPTION] - What the variation is for</li>
                    <li>• [X] days - Specific timeframe</li>
                </ul>
            </div>

            {/* Best Practices */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <h4 className="font-bold text-blue-800 mb-2">💡 Best Practices</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Always send via email for written record</li>
                    <li>• Request read receipts for important messages</li>
                    <li>• Keep copies of all correspondence</li>
                    <li>• Log sent messages in your Communication Log</li>
                    <li>• Follow up if no response within 7 days</li>
                </ul>
            </div>
        </div>
    );
}
