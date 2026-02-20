import { toolMetadata } from "@/data/tool-metadata";
import { Metadata } from "next";

export const metadata: Metadata = toolMetadata["aspect-ratio-calculator"];

export default function Layout({ children }: { children: React.ReactNode }) {
    return children;
}
