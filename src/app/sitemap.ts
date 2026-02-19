import { MetadataRoute } from "next";
import { readdirSync } from "fs";
import { join } from "path";

const BASE_URL = "https://vedawellapp.com";

function getToolSlugs(): string[] {
    try {
        const toolsDir = join(process.cwd(), "src/app/tools");
        return readdirSync(toolsDir, { withFileTypes: true })
            .filter((d) => d.isDirectory() && !d.name.startsWith("_") && !d.name.startsWith("."))
            .map((d) => d.name);
    } catch {
        return [];
    }
}

function getGameSlugs(): string[] {
    try {
        const gamesDir = join(process.cwd(), "src/app/games");
        return readdirSync(gamesDir, { withFileTypes: true })
            .filter((d) => d.isDirectory() && !d.name.startsWith("_") && !d.name.startsWith("."))
            .map((d) => d.name);
    } catch {
        return [];
    }
}

export default function sitemap(): MetadataRoute.Sitemap {
    const tools = getToolSlugs();
    const games = getGameSlugs();

    const staticPages: MetadataRoute.Sitemap = [
        { url: BASE_URL, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
        { url: `${BASE_URL}/tools`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
        { url: `${BASE_URL}/games`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
        { url: `${BASE_URL}/panchang`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
        { url: `${BASE_URL}/guardian`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
        { url: `${BASE_URL}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
        { url: `${BASE_URL}/privacy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    ];

    const toolPages: MetadataRoute.Sitemap = tools.map((slug) => ({
        url: `${BASE_URL}/tools/${slug}`,
        lastModified: new Date(),
        changeFrequency: "monthly" as const,
        priority: 0.7,
    }));

    const gamePages: MetadataRoute.Sitemap = games.map((slug) => ({
        url: `${BASE_URL}/games/${slug}`,
        lastModified: new Date(),
        changeFrequency: "monthly" as const,
        priority: 0.6,
    }));

    return [...staticPages, ...toolPages, ...gamePages];
}
