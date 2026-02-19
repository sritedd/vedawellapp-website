"use client";

import { useState } from "react";
import Link from "next/link";

type ToolCategory = 'all' | 'calculator' | 'converter' | 'generator' | 'productivity' | 'developer' | 'image' | 'wellness';

interface Tool {
    id: string;
    title: string;
    description: string;
    icon: string;
    category: ToolCategory;
    tags: string[];
    color: string; // 'green', 'blue', 'pink', etc. for card styling
    href: string;
}

const TOOLS: Tool[] = [
    // Calculators
    {
        id: 'tip-calculator',
        title: 'Tip Calculator',
        description: 'Calculate tips and split bills easily between friends.',
        icon: '💰',
        category: 'calculator',
        tags: ['tip', 'money', 'split'],
        color: 'border-green-500/50 hover:border-green-500',
        href: '/tools/tip-calculator'
    },
    {
        id: 'loan-calculator',
        title: 'Loan Calculator',
        description: 'Calculate monthly payments, interest, and amortization schedules.',
        icon: '🏦',
        category: 'calculator',
        tags: ['loan', 'mortgage', 'interest'],
        color: 'border-blue-500/50 hover:border-blue-500',
        href: '/tools/loan-calculator'
    },
    {
        id: 'bmi-calculator',
        title: 'BMI Calculator',
        description: 'Calculate your Body Mass Index with health insights.',
        icon: '⚖️',
        category: 'calculator',
        tags: ['health', 'fitness', 'bmi'],
        color: 'border-pink-500/50 hover:border-pink-500',
        href: '/tools/bmi-calculator'
    },
    {
        id: 'age-calculator',
        title: 'Age Calculator',
        description: 'Calculate your exact age in years, months, days, and more.',
        icon: '🎂',
        category: 'calculator',
        tags: ['age', 'birthday', 'date'],
        color: 'border-purple-500/50 hover:border-purple-500',
        href: '/tools/age-calculator'
    },

    // Converters
    {
        id: 'unit-converter',
        title: 'Unit Converter',
        description: 'Convert between length, weight, temperature, and volume units.',
        icon: '📏',
        category: 'converter',
        tags: ['unit', 'length', 'weight'],
        color: 'border-blue-500/50 hover:border-blue-500',
        href: '/tools/unit-converter'
    },
    {
        id: 'color-converter',
        title: 'Color Converter',
        description: 'Convert colors between HEX, RGB, HSL, and more formats.',
        icon: '🎨',
        category: 'converter',
        tags: ['color', 'hex', 'rgb'],
        color: 'border-purple-500/50 hover:border-purple-500',
        href: '/tools/color-converter'
    },

    // Generators
    {
        id: 'password-generator',
        title: 'Password Generator',
        description: 'Generate strong, secure passwords with customizable options.',
        icon: '🔑',
        category: 'generator',
        tags: ['security', 'password'],
        color: 'border-red-500/50 hover:border-red-500',
        href: '/tools/password-generator'
    },
    {
        id: 'qr-code-generator',
        title: 'QR Code Generator',
        description: 'Create QR codes for URLs, text, contact info, and more.',
        icon: '📱',
        category: 'generator',
        tags: ['qr', 'code', 'scan'],
        color: 'border-cyan-500/50 hover:border-cyan-500',
        href: '/tools/qr-code-generator'
    },

    // Productivity
    {
        id: 'focus-timer',
        title: 'Focus Timer Pro',
        description: 'Pomodoro-style productivity timer with task tracking.',
        icon: '🍅',
        category: 'productivity',
        tags: ['timer', 'focus', 'pomodoro'],
        color: 'border-red-500/50 hover:border-red-500',
        href: '/tools/focus-timer'
    },
    {
        id: 'todo-list',
        title: 'Todo List',
        description: 'Simple and effective task management with categories.',
        icon: '✅',
        category: 'productivity',
        tags: ['tasks', 'list', 'organize'],
        color: 'border-green-500/50 hover:border-green-500',
        href: '/tools/todo-list'
    },

    // Developer
    {
        id: 'json-formatter',
        title: 'JSON Formatter',
        description: 'Format, validate, beautify, and minify JSON data.',
        icon: '{ }',
        category: 'developer',
        tags: ['json', 'format', 'dev'],
        color: 'border-green-500/50 hover:border-green-500',
        href: '/tools/json-formatter'
    },
    {
        id: 'base64-encoder',
        title: 'Base64 Encoder',
        description: 'Encode and decode text and files to/from Base64 format.',
        icon: '🔐',
        category: 'developer',
        tags: ['base64', 'encode', 'decode'],
        color: 'border-indigo-500/50 hover:border-indigo-500',
        href: '/tools/base64-encoder'
    }
];

export default function ToolsPage() {
    const [search, setSearch] = useState("");
    const [activeCategory, setActiveCategory] = useState<ToolCategory>('all');

    const filteredTools = TOOLS.filter(tool => {
        const matchesSearch = tool.title.toLowerCase().includes(search.toLowerCase()) ||
            tool.description.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = activeCategory === 'all' || tool.category === activeCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="py-12 px-6">
            <div className="max-w-7xl mx-auto">
                {/* Hero Mini */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-extrabold mb-4">
                        🧰 All <span className="text-primary">Free Tools</span>
                    </h1>
                    <p className="text-lg text-muted max-w-2xl mx-auto">
                        90+ free, browser-based tools to boost your productivity. No sign-ups, no downloads — everything runs locally.
                    </p>
                </div>

                {/* Search */}
                <div className="max-w-2xl mx-auto mb-8">
                    <input
                        type="text"
                        placeholder="Search tools by name or category..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full px-6 py-4 rounded-xl border border-border bg-card shadow-sm focus:outline-none focus:ring-2 focus:ring-primary text-lg"
                    />
                </div>

                {/* Categories */}
                <div className="flex flex-wrap justify-center gap-2 mb-8">
                    <button
                        onClick={() => setActiveCategory('all')}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeCategory === 'all' ? 'bg-primary text-white' : 'bg-muted hover:bg-muted/80'
                            }`}
                    >
                        All Tools <span className="ml-1 opacity-70">{TOOLS.length}</span>
                    </button>
                    <button
                        onClick={() => setActiveCategory('calculator')}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeCategory === 'calculator' ? 'bg-primary text-white' : 'bg-muted hover:bg-muted/80'
                            }`}
                    >
                        💰 Calculators
                    </button>
                    <button
                        onClick={() => setActiveCategory('converter')}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeCategory === 'converter' ? 'bg-primary text-white' : 'bg-muted hover:bg-muted/80'
                            }`}
                    >
                        🔄 Converters
                    </button>
                    <button
                        onClick={() => setActiveCategory('generator')}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeCategory === 'generator' ? 'bg-primary text-white' : 'bg-muted hover:bg-muted/80'
                            }`}
                    >
                        ⚡ Generators
                    </button>
                    <button
                        onClick={() => setActiveCategory('productivity')}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeCategory === 'productivity' ? 'bg-primary text-white' : 'bg-muted hover:bg-muted/80'
                            }`}
                    >
                        📝 Productivity
                    </button>
                    <button
                        onClick={() => setActiveCategory('developer')}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeCategory === 'developer' ? 'bg-primary text-white' : 'bg-muted hover:bg-muted/80'
                            }`}
                    >
                        🛠️ Developer
                    </button>
                </div>

                <p className="text-center text-muted mb-12">
                    {filteredTools.length} tools found
                </p>

                {/* Tools Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTools.map((tool) => (
                        <Link
                            key={tool.id}
                            href={tool.href}
                            className={`group block bg-card rounded-xl p-6 border transition-all hover:bg-muted/5 hover:scale-[1.02] hover:shadow-lg ${tool.color}`}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <span className="text-4xl">{tool.icon}</span>
                                <span className="text-muted group-hover:text-primary transition-colors">→</span>
                            </div>
                            <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                                {tool.title}
                            </h3>
                            <p className="text-muted text-sm mb-4">
                                {tool.description}
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {tool.tags.map(tag => (
                                    <span key={tag} className="px-2 py-1 rounded bg-muted text-xs text-muted-foreground uppercase tracking-wider">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
