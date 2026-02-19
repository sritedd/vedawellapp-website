"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function MarkdownEditor() {
    const [markdown, setMarkdown] = useState(`# Welcome to Markdown Editor

This is a **live preview** markdown editor. Start typing on the left and see the rendered output on the right!

## Features

- **Bold text** with \`**text**\`
- *Italic text* with \`*text*\`
- ~~Strikethrough~~ with \`~~text~~\`
- \`Inline code\` with backticks

### Code Blocks

\`\`\`javascript
function greet(name) {
    return \`Hello, \${name}!\`;
}
\`\`\`

### Lists

1. First ordered item
2. Second ordered item
3. Third ordered item

- Unordered item
- Another item
  - Nested item

### Blockquotes

> This is a blockquote.
> It can span multiple lines.

### Links and Images

[Visit VedaWell](https://vedawell.in)

### Tables

| Feature | Status |
|---------|--------|
| Bold | ✅ |
| Italic | ✅ |
| Code | ✅ |
| Tables | ✅ |

---

Have fun writing! 🎉
`);
    const [html, setHtml] = useState("");
    const [copied, setCopied] = useState(false);

    // Simple markdown parser
    const parseMarkdown = (md: string): string => {
        let result = md
            // Escape HTML
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            // Code blocks (must be before other processing)
            .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre class="bg-slate-800 text-green-400 p-4 rounded-lg overflow-x-auto my-4 text-sm"><code>$2</code></pre>')
            // Inline code
            .replace(/`([^`]+)`/g, '<code class="bg-slate-200 text-pink-600 px-1.5 py-0.5 rounded text-sm">$1</code>')
            // Headers
            .replace(/^### (.*$)/gim, '<h3 class="text-xl font-bold mt-6 mb-3">$1</h3>')
            .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold mt-8 mb-4 pb-2 border-b border-slate-200">$1</h2>')
            .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold mt-8 mb-4">$1</h1>')
            // Bold and italic
            .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
            .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>')
            .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
            .replace(/~~(.*?)~~/g, '<del class="line-through">$1</del>')
            // Blockquotes
            .replace(/^\&gt; (.*$)/gim, '<blockquote class="border-l-4 border-blue-400 pl-4 my-4 text-slate-600 italic">$1</blockquote>')
            // Horizontal rule
            .replace(/^---$/gim, '<hr class="my-8 border-slate-300">')
            // Links
            .replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2" class="text-blue-600 hover:underline" target="_blank" rel="noopener">$1</a>')
            // Images
            .replace(/!\[([^\]]*)\]\(([^\)]+)\)/g, '<img src="$2" alt="$1" class="max-w-full rounded-lg my-4">')
            // Tables
            .replace(/^\|(.+)\|$/gim, (match) => {
                const cells = match.split('|').filter(c => c.trim());
                const isHeader = /^[\s-|]+$/.test(cells.join(''));
                if (isHeader) return '';
                return `<tr>${cells.map(c => `<td class="border border-slate-300 px-4 py-2">${c.trim()}</td>`).join('')}</tr>`;
            })
            // Ordered lists
            .replace(/^\d+\. (.*$)/gim, '<li class="ml-6 list-decimal">$1</li>')
            // Unordered lists  
            .replace(/^[\-\*] (.*$)/gim, '<li class="ml-6 list-disc">$1</li>')
            // Paragraphs (lines with content that aren't already wrapped)
            .replace(/^(?!<[a-z]|$)(.*$)/gim, '<p class="my-2">$1</p>');

        // Wrap consecutive list items
        result = result
            .replace(/(<li class="ml-6 list-decimal">.*<\/li>\n?)+/g, '<ol class="my-4">$&</ol>')
            .replace(/(<li class="ml-6 list-disc">.*<\/li>\n?)+/g, '<ul class="my-4">$&</ul>');

        // Wrap table rows
        result = result.replace(/(<tr>.*<\/tr>\n?)+/g, '<table class="w-full border-collapse my-4">$&</table>');

        return result;
    };

    useEffect(() => {
        setHtml(parseMarkdown(markdown));
    }, [markdown]);

    const copyHtml = () => {
        navigator.clipboard.writeText(html);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const copyMarkdown = () => {
        navigator.clipboard.writeText(markdown);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const downloadMarkdown = () => {
        const blob = new Blob([markdown], { type: "text/markdown" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "document.md";
        a.click();
        URL.revokeObjectURL(url);
    };

    const downloadHtml = () => {
        const fullHtml = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Markdown Document</title>
    <style>
        body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; line-height: 1.6; }
        pre { background: #1e293b; color: #4ade80; padding: 1rem; border-radius: 0.5rem; overflow-x: auto; }
        code { background: #e2e8f0; color: #db2777; padding: 0.125rem 0.375rem; border-radius: 0.25rem; }
        blockquote { border-left: 4px solid #60a5fa; padding-left: 1rem; color: #64748b; font-style: italic; }
        table { border-collapse: collapse; width: 100%; }
        td, th { border: 1px solid #cbd5e1; padding: 0.5rem 1rem; }
        a { color: #2563eb; }
    </style>
</head>
<body>
${html}
</body>
</html>`;
        const blob = new Blob([fullHtml], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "document.html";
        a.click();
        URL.revokeObjectURL(url);
    };

    const clearEditor = () => {
        if (confirm("Clear all content?")) {
            setMarkdown("");
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
            {/* Header */}
            <nav className="border-b border-slate-700 bg-slate-900/80 backdrop-blur sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Link href="/tools" className="text-slate-400 hover:text-white">
                            ← Back
                        </Link>
                        <h1 className="text-xl font-bold text-white flex items-center gap-2">
                            <span>📝</span>
                            Markdown Editor
                        </h1>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={copyMarkdown}
                            className="px-3 py-1.5 bg-slate-700 text-white rounded text-sm hover:bg-slate-600"
                        >
                            {copied ? "✓ Copied" : "Copy MD"}
                        </button>
                        <button
                            onClick={copyHtml}
                            className="px-3 py-1.5 bg-slate-700 text-white rounded text-sm hover:bg-slate-600"
                        >
                            Copy HTML
                        </button>
                        <button
                            onClick={downloadMarkdown}
                            className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                        >
                            ⬇️ .md
                        </button>
                        <button
                            onClick={downloadHtml}
                            className="px-3 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                        >
                            ⬇️ .html
                        </button>
                        <button
                            onClick={clearEditor}
                            className="px-3 py-1.5 bg-red-600/20 text-red-400 rounded text-sm hover:bg-red-600/30"
                        >
                            Clear
                        </button>
                    </div>
                </div>
            </nav>

            {/* Editor */}
            <div className="flex h-[calc(100vh-65px)]">
                {/* Input */}
                <div className="flex-1 flex flex-col border-r border-slate-700">
                    <div className="px-4 py-2 bg-slate-800 text-slate-400 text-sm border-b border-slate-700">
                        Markdown Input
                    </div>
                    <textarea
                        value={markdown}
                        onChange={(e) => setMarkdown(e.target.value)}
                        className="flex-1 p-6 bg-slate-900 text-slate-100 font-mono text-sm resize-none focus:outline-none"
                        placeholder="Type your markdown here..."
                        spellCheck={false}
                    />
                </div>

                {/* Preview */}
                <div className="flex-1 flex flex-col">
                    <div className="px-4 py-2 bg-slate-800 text-slate-400 text-sm border-b border-slate-700">
                        Live Preview
                    </div>
                    <div
                        className="flex-1 p-6 bg-white text-slate-800 overflow-y-auto prose max-w-none"
                        dangerouslySetInnerHTML={{ __html: html }}
                    />
                </div>
            </div>
        </div>
    );
}
