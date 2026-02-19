"use client";

import { useState, useRef } from "react";
import Link from "next/link";

interface LineItem {
    id: string;
    description: string;
    quantity: number;
    rate: number;
}

interface InvoiceData {
    businessName: string;
    businessDetails: string;
    clientName: string;
    clientDetails: string;
    invoiceNumber: string;
    currency: string;
    issueDate: string;
    dueDate: string;
    taxRate: number;
    taxLabel: string;
    notes: string;
    lineItems: LineItem[];
    logoUrl: string | null;
}

const CURRENCIES = [
    { value: "$", label: "$ USD" },
    { value: "A$", label: "A$ AUD" },
    { value: "€", label: "€ EUR" },
    { value: "£", label: "£ GBP" },
    { value: "₹", label: "₹ INR" },
    { value: "¥", label: "¥ JPY" },
    { value: "C$", label: "C$ CAD" },
];

export default function InvoiceGenerator() {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const printRef = useRef<HTMLDivElement>(null);

    const today = new Date().toISOString().split("T")[0];
    const defaultDue = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    const [invoice, setInvoice] = useState<InvoiceData>({
        businessName: "",
        businessDetails: "",
        clientName: "",
        clientDetails: "",
        invoiceNumber: "INV-001",
        currency: "A$",
        issueDate: today,
        dueDate: defaultDue,
        taxRate: 10,
        taxLabel: "GST",
        notes: "",
        lineItems: [{ id: "1", description: "", quantity: 1, rate: 0 }],
        logoUrl: null,
    });

    // Calculations
    const subtotal = invoice.lineItems.reduce((sum, item) => sum + item.quantity * item.rate, 0);
    const taxAmount = subtotal * (invoice.taxRate / 100);
    const total = subtotal + taxAmount;

    const formatCurrency = (amount: number) => {
        return invoice.currency + amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return "";
        return new Date(dateStr).toLocaleDateString("en-AU", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    const updateInvoice = (updates: Partial<InvoiceData>) => {
        setInvoice({ ...invoice, ...updates });
    };

    const addLineItem = () => {
        const newItem: LineItem = {
            id: Date.now().toString(),
            description: "",
            quantity: 1,
            rate: 0,
        };
        updateInvoice({ lineItems: [...invoice.lineItems, newItem] });
    };

    const updateLineItem = (id: string, field: keyof LineItem, value: string | number) => {
        const updated = invoice.lineItems.map((item) =>
            item.id === id ? { ...item, [field]: value } : item
        );
        updateInvoice({ lineItems: updated });
    };

    const removeLineItem = (id: string) => {
        if (invoice.lineItems.length > 1) {
            updateInvoice({ lineItems: invoice.lineItems.filter((item) => item.id !== id) });
        }
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                updateInvoice({ logoUrl: e.target?.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const saveInvoice = () => {
        const data = JSON.stringify(invoice);
        const blob = new Blob([data], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${invoice.invoiceNumber || "invoice"}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const loadInvoice = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target?.result as string);
                    setInvoice(data);
                } catch {
                    alert("Invalid invoice file");
                }
            };
            reader.readAsText(file);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900">
            {/* Print Styles */}
            <style jsx global>{`
                @media print {
                    body * { visibility: hidden; }
                    .print-area, .print-area * { visibility: visible; }
                    .print-area { position: absolute; left: 0; top: 0; width: 100%; }
                    .no-print { display: none !important; }
                }
            `}</style>

            <div className="flex flex-col lg:flex-row min-h-screen">
                {/* Sidebar Form */}
                <div className="lg:w-[420px] bg-slate-800 p-6 overflow-y-auto no-print border-r border-slate-700">
                    {/* Header */}
                    <div className="mb-6">
                        <Link href="/tools" className="text-blue-400 hover:text-blue-300 text-sm mb-2 inline-block">
                            ← Back to Tools
                        </Link>
                        <h1 className="text-2xl font-bold text-white bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                            📄 Invoice Generator Pro
                        </h1>
                        <p className="text-slate-400 text-sm">Create professional invoices in seconds</p>
                    </div>

                    {/* Your Business */}
                    <section className="mb-6 pb-6 border-b border-slate-700">
                        <h2 className="text-xs uppercase tracking-wider text-slate-400 mb-4 font-medium">Your Business</h2>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs text-slate-400 mb-1">Business Name</label>
                                <input
                                    type="text"
                                    value={invoice.businessName}
                                    onChange={(e) => updateInvoice({ businessName: e.target.value })}
                                    placeholder="Your Business Name"
                                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:border-blue-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-400 mb-1">Your Details</label>
                                <textarea
                                    value={invoice.businessDetails}
                                    onChange={(e) => updateInvoice({ businessDetails: e.target.value })}
                                    placeholder={"123 Business St\nCity, State 12345\nemail@example.com"}
                                    rows={3}
                                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:border-blue-500 focus:outline-none resize-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-400 mb-1">Logo</label>
                                <div className="flex items-center gap-3">
                                    <div className="w-14 h-14 bg-slate-700 rounded-lg border border-slate-600 flex items-center justify-center overflow-hidden">
                                        {invoice.logoUrl ? (
                                            <img src={invoice.logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
                                        ) : (
                                            <span className="text-xs text-slate-500">No logo</span>
                                        )}
                                    </div>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleLogoUpload}
                                        accept="image/*"
                                        className="hidden"
                                    />
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="px-3 py-1.5 bg-slate-700 border border-slate-600 rounded text-white text-sm hover:bg-slate-600"
                                    >
                                        Upload
                                    </button>
                                    {invoice.logoUrl && (
                                        <button
                                            onClick={() => updateInvoice({ logoUrl: null })}
                                            className="px-3 py-1.5 bg-slate-700 border border-slate-600 rounded text-white text-sm hover:bg-slate-600"
                                        >
                                            Remove
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Bill To */}
                    <section className="mb-6 pb-6 border-b border-slate-700">
                        <h2 className="text-xs uppercase tracking-wider text-slate-400 mb-4 font-medium">Bill To</h2>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs text-slate-400 mb-1">Client Name</label>
                                <input
                                    type="text"
                                    value={invoice.clientName}
                                    onChange={(e) => updateInvoice({ clientName: e.target.value })}
                                    placeholder="Client or Company Name"
                                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:border-blue-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-400 mb-1">Client Details</label>
                                <textarea
                                    value={invoice.clientDetails}
                                    onChange={(e) => updateInvoice({ clientDetails: e.target.value })}
                                    placeholder="Client address, email, etc."
                                    rows={3}
                                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:border-blue-500 focus:outline-none resize-none"
                                />
                            </div>
                        </div>
                    </section>

                    {/* Invoice Details */}
                    <section className="mb-6 pb-6 border-b border-slate-700">
                        <h2 className="text-xs uppercase tracking-wider text-slate-400 mb-4 font-medium">Invoice Details</h2>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs text-slate-400 mb-1">Invoice Number</label>
                                <input
                                    type="text"
                                    value={invoice.invoiceNumber}
                                    onChange={(e) => updateInvoice({ invoiceNumber: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:border-blue-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-400 mb-1">Currency</label>
                                <select
                                    value={invoice.currency}
                                    onChange={(e) => updateInvoice({ currency: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:border-blue-500 focus:outline-none"
                                >
                                    {CURRENCIES.map((c) => (
                                        <option key={c.value} value={c.value}>{c.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-slate-400 mb-1">Issue Date</label>
                                <input
                                    type="date"
                                    value={invoice.issueDate}
                                    onChange={(e) => updateInvoice({ issueDate: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:border-blue-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-400 mb-1">Due Date</label>
                                <input
                                    type="date"
                                    value={invoice.dueDate}
                                    onChange={(e) => updateInvoice({ dueDate: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:border-blue-500 focus:outline-none"
                                />
                            </div>
                        </div>
                    </section>

                    {/* Line Items */}
                    <section className="mb-6 pb-6 border-b border-slate-700">
                        <h2 className="text-xs uppercase tracking-wider text-slate-400 mb-4 font-medium">Line Items</h2>
                        <div className="space-y-2">
                            {invoice.lineItems.map((item) => (
                                <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                                    <input
                                        type="text"
                                        value={item.description}
                                        onChange={(e) => updateLineItem(item.id, "description", e.target.value)}
                                        placeholder="Description"
                                        className="col-span-5 px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:border-blue-500 focus:outline-none"
                                    />
                                    <input
                                        type="number"
                                        value={item.quantity}
                                        onChange={(e) => updateLineItem(item.id, "quantity", parseFloat(e.target.value) || 0)}
                                        placeholder="Qty"
                                        min="0"
                                        step="0.5"
                                        className="col-span-2 px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:border-blue-500 focus:outline-none"
                                    />
                                    <input
                                        type="number"
                                        value={item.rate}
                                        onChange={(e) => updateLineItem(item.id, "rate", parseFloat(e.target.value) || 0)}
                                        placeholder="Rate"
                                        min="0"
                                        step="0.01"
                                        className="col-span-3 px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:border-blue-500 focus:outline-none"
                                    />
                                    <button
                                        onClick={() => removeLineItem(item.id)}
                                        className="col-span-2 px-2 py-1.5 bg-red-500/20 text-red-400 rounded text-sm hover:bg-red-500/30 disabled:opacity-50"
                                        disabled={invoice.lineItems.length <= 1}
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={addLineItem}
                            className="w-full mt-3 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm hover:bg-slate-600"
                        >
                            + Add Item
                        </button>
                    </section>

                    {/* Tax */}
                    <section className="mb-6 pb-6 border-b border-slate-700">
                        <h2 className="text-xs uppercase tracking-wider text-slate-400 mb-4 font-medium">Tax</h2>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs text-slate-400 mb-1">Tax Rate (%)</label>
                                <input
                                    type="number"
                                    value={invoice.taxRate}
                                    onChange={(e) => updateInvoice({ taxRate: parseFloat(e.target.value) || 0 })}
                                    min="0"
                                    max="100"
                                    step="0.1"
                                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:border-blue-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-400 mb-1">Tax Label</label>
                                <input
                                    type="text"
                                    value={invoice.taxLabel}
                                    onChange={(e) => updateInvoice({ taxLabel: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:border-blue-500 focus:outline-none"
                                />
                            </div>
                        </div>
                    </section>

                    {/* Notes */}
                    <section className="mb-6 pb-6 border-b border-slate-700">
                        <h2 className="text-xs uppercase tracking-wider text-slate-400 mb-4 font-medium">Notes & Payment Info</h2>
                        <textarea
                            value={invoice.notes}
                            onChange={(e) => updateInvoice({ notes: e.target.value })}
                            placeholder="Payment terms, bank details, thank you message..."
                            rows={3}
                            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:border-blue-500 focus:outline-none resize-none"
                        />
                    </section>

                    {/* Actions */}
                    <div className="flex gap-2">
                        <button
                            onClick={handlePrint}
                            className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
                        >
                            🖨️ Print / PDF
                        </button>
                        <button
                            onClick={saveInvoice}
                            className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                        >
                            💾 Save
                        </button>
                    </div>
                    <div className="mt-2">
                        <input
                            type="file"
                            id="loadFile"
                            onChange={loadInvoice}
                            accept=".json"
                            className="hidden"
                        />
                        <label
                            htmlFor="loadFile"
                            className="block w-full px-4 py-2.5 bg-slate-700 text-white text-center rounded-lg font-medium hover:bg-slate-600 cursor-pointer"
                        >
                            📂 Load Invoice
                        </label>
                    </div>
                </div>

                {/* Preview Area */}
                <div className="flex-1 bg-slate-600 p-8 overflow-y-auto flex justify-center">
                    <div ref={printRef} className="print-area bg-white w-full max-w-[210mm] min-h-[297mm] p-10 shadow-2xl text-slate-800">
                        {/* Invoice Header */}
                        <div className="flex justify-between mb-10">
                            <div>
                                {invoice.logoUrl && (
                                    <img src={invoice.logoUrl} alt="Logo" className="max-h-16 max-w-[200px]" />
                                )}
                            </div>
                            <div className="text-right">
                                <h1 className="text-4xl font-bold text-blue-600 mb-1">INVOICE</h1>
                                <div className="text-slate-500">{invoice.invoiceNumber}</div>
                            </div>
                        </div>

                        {/* Parties */}
                        <div className="grid grid-cols-2 gap-10 mb-10">
                            <div>
                                <h3 className="text-xs uppercase tracking-wider text-slate-400 mb-2">From</h3>
                                <div className="font-semibold text-lg">{invoice.businessName || "Your Business"}</div>
                                <div className="text-sm text-slate-600 whitespace-pre-line">{invoice.businessDetails}</div>
                            </div>
                            <div>
                                <h3 className="text-xs uppercase tracking-wider text-slate-400 mb-2">Bill To</h3>
                                <div className="font-semibold text-lg">{invoice.clientName || "Client Name"}</div>
                                <div className="text-sm text-slate-600 whitespace-pre-line">{invoice.clientDetails}</div>
                            </div>
                        </div>

                        {/* Meta */}
                        <div className="grid grid-cols-3 gap-5 mb-10 p-5 bg-slate-50 rounded-lg">
                            <div>
                                <div className="text-xs uppercase tracking-wider text-slate-400">Invoice Number</div>
                                <div className="font-semibold">{invoice.invoiceNumber}</div>
                            </div>
                            <div>
                                <div className="text-xs uppercase tracking-wider text-slate-400">Issue Date</div>
                                <div className="font-semibold">{formatDate(invoice.issueDate)}</div>
                            </div>
                            <div>
                                <div className="text-xs uppercase tracking-wider text-slate-400">Due Date</div>
                                <div className="font-semibold">{formatDate(invoice.dueDate)}</div>
                            </div>
                        </div>

                        {/* Table */}
                        <table className="w-full mb-8">
                            <thead>
                                <tr className="bg-slate-800 text-white text-sm uppercase tracking-wide">
                                    <th className="py-3 px-4 text-left">Description</th>
                                    <th className="py-3 px-4 text-left">Qty</th>
                                    <th className="py-3 px-4 text-left">Rate</th>
                                    <th className="py-3 px-4 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoice.lineItems.map((item, i) => (
                                    <tr key={i} className="border-b border-slate-200">
                                        <td className="py-4 px-4">{item.description || "-"}</td>
                                        <td className="py-4 px-4">{item.quantity}</td>
                                        <td className="py-4 px-4">{formatCurrency(item.rate)}</td>
                                        <td className="py-4 px-4 text-right">{formatCurrency(item.quantity * item.rate)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Totals */}
                        <div className="flex justify-end mb-10">
                            <div className="w-72">
                                <div className="flex justify-between py-2 border-b border-slate-200">
                                    <span>Subtotal</span>
                                    <span>{formatCurrency(subtotal)}</span>
                                </div>
                                {invoice.taxRate > 0 && (
                                    <div className="flex justify-between py-2 border-b border-slate-200">
                                        <span>{invoice.taxLabel} ({invoice.taxRate}%)</span>
                                        <span>{formatCurrency(taxAmount)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between py-4 border-t-2 border-slate-800 font-bold text-xl">
                                    <span>Total</span>
                                    <span>{formatCurrency(total)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Notes */}
                        {invoice.notes && (
                            <div className="border-t border-slate-200 pt-6 mt-10">
                                <h4 className="text-xs uppercase tracking-wider text-slate-400 mb-2">Notes / Payment Info</h4>
                                <p className="text-sm text-slate-600 whitespace-pre-line">{invoice.notes}</p>
                            </div>
                        )}

                        {/* Footer */}
                        <div className="mt-10 text-center text-sm text-slate-400">
                            Thank you for your business!
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
