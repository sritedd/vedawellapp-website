const fs = require('fs');
const path = require('path');

const toolsDir = path.join(__dirname, 'src/app/tools');
const metadataPath = path.join(__dirname, 'src/data/tool-metadata.ts');

function toTitleCase(str) {
    return str.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

// 1. Find all tool directories
const existingTools = fs.readdirSync(toolsDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory() && dirent.name !== '__tests__')
    .map(dirent => dirent.name);

// 2. Generate tool metadata
if (!fs.existsSync(path.dirname(metadataPath))) {
    fs.mkdirSync(path.dirname(metadataPath), { recursive: true });
}

let metadataContent = `import { Metadata } from "next";\n\n`;
metadataContent += `export const toolMetadata: Record<string, Metadata> = {\n`;

for (const toolId of existingTools) {
    const title = toTitleCase(toolId);
    metadataContent += `  "${toolId}": {
    title: "${title} - Free Online Tool",
    description: "Free online ${title.toLowerCase()} tool. Fast, secure, and easy to use on VedaWell.",
    keywords: ["${title.toLowerCase()}", "free online tool", "vedawell"],
  },\n`;
}

metadataContent += `};\n`;
fs.writeFileSync(metadataPath, metadataContent);
console.log(`Generated ${metadataPath} for ${existingTools.length} tools`);

// 3. Generate layout.tsx for each tool
let generatedCount = 0;
for (const toolId of existingTools) {
    const layoutPath = path.join(toolsDir, toolId, 'layout.tsx');
    const layoutContent = `import { toolMetadata } from "@/data/tool-metadata";
import { Metadata } from "next";

export const metadata: Metadata = toolMetadata["${toolId}"];

export default function Layout({ children }: { children: React.ReactNode }) {
    return children;
}
`;
    fs.writeFileSync(layoutPath, layoutContent);
    generatedCount++;
}

console.log(`Generated layout.tsx for ${generatedCount} tools.`);
