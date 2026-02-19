"use client";

import { useState } from "react";
import Link from "next/link";

export default function SchemaMarkupGenerator() {
    const [schemaType, setSchemaType] = useState<"article" | "product" | "faq" | "organization" | "localBusiness">("article");
    const [copied, setCopied] = useState(false);

    // Article
    const [article, setArticle] = useState({ headline: "Your Article Title", description: "Article description here", author: "John Doe", datePublished: "2025-01-14", image: "https://example.com/image.jpg" });

    // Product
    const [product, setProduct] = useState({ name: "Product Name", description: "Product description", price: "99.99", currency: "USD", availability: "InStock", image: "https://example.com/product.jpg" });

    // FAQ
    const [faqs, setFaqs] = useState([{ question: "What is this?", answer: "This is the answer." }]);

    // Organization
    const [org, setOrg] = useState({ name: "Company Name", url: "https://example.com", logo: "https://example.com/logo.png", description: "Company description" });

    // Local Business
    const [business, setBusiness] = useState({ name: "Business Name", address: "123 Main St, City, State 12345", phone: "+1-555-555-5555", url: "https://example.com" });

    const generateSchema = (): string => {
        let schema: Record<string, unknown> = {};

        if (schemaType === "article") {
            schema = { "@context": "https://schema.org", "@type": "Article", headline: article.headline, description: article.description, author: { "@type": "Person", name: article.author }, datePublished: article.datePublished, image: article.image };
        } else if (schemaType === "product") {
            schema = { "@context": "https://schema.org", "@type": "Product", name: product.name, description: product.description, image: product.image, offers: { "@type": "Offer", price: product.price, priceCurrency: product.currency, availability: `https://schema.org/${product.availability}` } };
        } else if (schemaType === "faq") {
            schema = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map(f => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })) };
        } else if (schemaType === "organization") {
            schema = { "@context": "https://schema.org", "@type": "Organization", name: org.name, url: org.url, logo: org.logo, description: org.description };
        } else if (schemaType === "localBusiness") {
            schema = { "@context": "https://schema.org", "@type": "LocalBusiness", name: business.name, address: business.address, telephone: business.phone, url: business.url };
        }

        return `<script type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n</script>`;
    };

    const copy = () => { navigator.clipboard.writeText(generateSchema()); setCopied(true); setTimeout(() => setCopied(false), 2000); };

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-900 via-slate-900 to-slate-900">
            <nav className="border-b border-orange-800/50 bg-slate-900/80 backdrop-blur">
                <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Link href="/tools" className="text-orange-400 hover:text-white">← Back</Link>
                        <h1 className="text-xl font-bold text-white">📋 Schema Markup Generator</h1>
                    </div>
                    <button onClick={copy} className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm">{copied ? "✓ Copied" : "Copy Code"}</button>
                </div>
            </nav>
            <main className="max-w-4xl mx-auto p-6">
                <div className="bg-slate-800/50 rounded-xl p-4 border border-orange-800/30 mb-6 flex gap-2 flex-wrap">
                    {(["article", "product", "faq", "organization", "localBusiness"] as const).map(t => (
                        <button key={t} onClick={() => setSchemaType(t)} className={`px-4 py-2 rounded-lg capitalize ${schemaType === t ? "bg-orange-600 text-white" : "bg-slate-700 text-slate-300"}`}>{t === "localBusiness" ? "Local Business" : t}</button>
                    ))}
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-slate-800/50 rounded-xl p-6 border border-orange-800/30 space-y-4">
                        {schemaType === "article" && Object.entries(article).map(([key, val]) => (
                            <div key={key}><label className="block text-sm text-orange-300 mb-1 capitalize">{key}</label><input type={key === "datePublished" ? "date" : "text"} value={val} onChange={(e) => setArticle({ ...article, [key]: e.target.value })} className="w-full px-4 py-2 bg-slate-900 border border-orange-700 rounded text-white" /></div>
                        ))}
                        {schemaType === "product" && Object.entries(product).map(([key, val]) => (
                            <div key={key}><label className="block text-sm text-orange-300 mb-1 capitalize">{key}</label><input type="text" value={val} onChange={(e) => setProduct({ ...product, [key]: e.target.value })} className="w-full px-4 py-2 bg-slate-900 border border-orange-700 rounded text-white" /></div>
                        ))}
                        {schemaType === "faq" && (
                            <>
                                {faqs.map((faq, i) => (
                                    <div key={i} className="p-3 bg-slate-900 rounded-lg">
                                        <input type="text" value={faq.question} onChange={(e) => { const updated = [...faqs]; updated[i].question = e.target.value; setFaqs(updated); }} placeholder="Question" className="w-full px-3 py-2 bg-slate-800 border border-orange-700 rounded text-white mb-2" />
                                        <textarea value={faq.answer} onChange={(e) => { const updated = [...faqs]; updated[i].answer = e.target.value; setFaqs(updated); }} placeholder="Answer" rows={2} className="w-full px-3 py-2 bg-slate-800 border border-orange-700 rounded text-white" />
                                    </div>
                                ))}
                                <button onClick={() => setFaqs([...faqs, { question: "", answer: "" }])} className="text-orange-400 text-sm">+ Add FAQ</button>
                            </>
                        )}
                        {schemaType === "organization" && Object.entries(org).map(([key, val]) => (
                            <div key={key}><label className="block text-sm text-orange-300 mb-1 capitalize">{key}</label><input type="text" value={val} onChange={(e) => setOrg({ ...org, [key]: e.target.value })} className="w-full px-4 py-2 bg-slate-900 border border-orange-700 rounded text-white" /></div>
                        ))}
                        {schemaType === "localBusiness" && Object.entries(business).map(([key, val]) => (
                            <div key={key}><label className="block text-sm text-orange-300 mb-1 capitalize">{key}</label><input type="text" value={val} onChange={(e) => setBusiness({ ...business, [key]: e.target.value })} className="w-full px-4 py-2 bg-slate-900 border border-orange-700 rounded text-white" /></div>
                        ))}
                    </div>
                    <div className="bg-slate-800/50 rounded-xl p-6 border border-orange-800/30">
                        <h3 className="text-white font-medium mb-4">Generated Schema</h3>
                        <pre className="p-4 bg-slate-900 rounded-lg text-green-400 font-mono text-xs overflow-auto max-h-[500px]">{generateSchema()}</pre>
                    </div>
                </div>
            </main>
        </div>
    );
}
