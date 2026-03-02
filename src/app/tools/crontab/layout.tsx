import { toolMetadata } from "@/data/tool-metadata";
import { Metadata } from "next";
import ToolJsonLd from "@/components/seo/ToolJsonLd";

export const metadata: Metadata = toolMetadata["crontab"];

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <ToolJsonLd slug="crontab" />
            {children}
        </>
    );
}
