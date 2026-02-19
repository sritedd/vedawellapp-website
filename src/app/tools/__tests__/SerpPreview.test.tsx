"use client";
import { render, screen } from "@testing-library/react";
jest.mock("next/link", () => ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>);
import SerpPreview from "../serp-preview/page";
describe("SERP Preview", () => {
    it("renders", () => { render(<SerpPreview />); expect(screen.getByText("🔍 SERP Preview Tool")).toBeInTheDocument(); });
    it("shows Back link", () => { render(<SerpPreview />); expect(screen.getByText("← Back")).toBeInTheDocument(); });
});
