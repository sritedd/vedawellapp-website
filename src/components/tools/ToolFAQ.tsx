"use client";

import { useState } from "react";
import JsonLd from "@/components/seo/JsonLd";

interface FAQItem {
    question: string;
    answer: string;
}

interface ToolFAQProps {
    faqs: FAQItem[];
}

export default function ToolFAQ({ faqs }: ToolFAQProps) {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    return (
        <>
            {/* FAQ Schema for Google Rich Snippets */}
            <JsonLd
                type="FAQPage"
                data={{
                    mainEntity: faqs.map(faq => ({
                        "@type": "Question",
                        name: faq.question,
                        acceptedAnswer: {
                            "@type": "Answer",
                            text: faq.answer,
                        },
                    })),
                }}
            />

            <div className="mt-12">
                <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
                <div className="space-y-3">
                    {faqs.map((faq, i) => (
                        <div key={i} className="border border-border rounded-lg overflow-hidden">
                            <button
                                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                                className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/5 transition-colors"
                            >
                                <span className="font-medium pr-4">{faq.question}</span>
                                <span className="text-muted flex-shrink-0">
                                    {openIndex === i ? "−" : "+"}
                                </span>
                            </button>
                            {openIndex === i && (
                                <div className="px-4 pb-4 text-muted text-sm leading-relaxed">
                                    {faq.answer}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}
