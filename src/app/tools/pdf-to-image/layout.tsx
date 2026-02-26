import { toolMetadata } from "@/data/tool-metadata";
import { Metadata } from "next";

export const metadata: Metadata = toolMetadata["pdf-to-image"];

export default function Layout({ children }: { children: React.ReactNode }) {
    return children;
}
