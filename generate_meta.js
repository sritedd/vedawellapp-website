const fs = require('fs');
const path = require('path');

const toolsPagePath = path.join(__dirname, 'src/app/tools/page.tsx');
const metadataPath = path.join(__dirname, 'src/data/tool-metadata.ts');
const toolsDir = path.join(__dirname, 'src/app/tools');

const content = fs.readFileSync(toolsPagePath, 'utf8');

const startIndex = content.indexOf('const TOOLS: Tool[] = [');
if (startIndex === -1) {
    console.error("Could not find start of TOOLS array");
    process.exit(1);
}

const endIndex = content.indexOf('export default function ToolsPage');
if (endIndex === -1) {
    console.error("Could not find end of TOOLS array");
    process.exit(1);
}

// Get the array string
let toolsStr = content.substring(startIndex + 'const TOOLS: Tool[] = '.length, endIndex);
// Now we have something ending with `];\r\n\r\n`
toolsStr = toolsStr.trim();
if (toolsStr.endsWith(';')) {
    toolsStr = toolsStr.substring(0, toolsStr.length - 1);
}

// Safely convert to JS object
const TOOLS = eval(`(${toolsStr})`);

// 1. Generate src/data/tool-metadata.ts
if (!fs.existsSync(path.dirname(metadataPath))) {
    fs.mkdirSync(path.dirname(metadataPath), { recursive: true });
}

let metadataContent = `import { Metadata } from "next";\n\n`;
metadataContent += `export const toolMetadata: Record<string, Metadata> = {\n`;

for (const tool of TOOLS) {
    metadataContent += `  "${tool.id}": {
    title: "${tool.title} - Free Online Tool",
    description: "${tool.description.replace(/"/g, '\\"')}",
    keywords: [${tool.tags.map(t => `"${t}"`).join(', ')}, "${tool.title.toLowerCase()}", "free online tool"],
  },\n`;
}

metadataContent += `};\n`;

fs.writeFileSync(metadataPath, metadataContent);
console.log(`Generated ${metadataPath}`);

// 2. Generate layout.tsx for each tool
let generatedCount = 0;
const existingTools = fs.readdirSync(toolsDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

for (const tool of TOOLS) {
    if (existingTools.includes(tool.id)) {
        const layoutPath = path.join(toolsDir, tool.id, 'layout.tsx');
        const layoutContent = `import { toolMetadata } from "@/data/tool-metadata";
import { Metadata } from "next";

export const metadata: Metadata = toolMetadata["${tool.id}"];

export default function Layout({ children }: { children: React.ReactNode }) {
    return children;
}
`;
        fs.writeFileSync(layoutPath, layoutContent);
        generatedCount++;
    }
}

console.log(`Generated layout.tsx for ${generatedCount} tools.`);
