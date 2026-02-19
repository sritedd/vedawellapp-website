import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: "*",
                allow: "/",
                disallow: ["/guardian/dashboard", "/guardian/projects"],
            },
        ],
        sitemap: "https://vedawellapp.com/sitemap.xml",
    };
}
