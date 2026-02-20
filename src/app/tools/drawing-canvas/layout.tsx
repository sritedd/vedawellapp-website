import { toolMetadata } from "@/data/tool-metadata";
import { Metadata } from "next";

export const metadata: Metadata = toolMetadata["drawing-canvas"];

export default function Layout({ children }: { children: React.ReactNode }) {
    return children;
}
