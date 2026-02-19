"use client";
import { render, screen } from "@testing-library/react";
jest.mock("next/link", () => ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>);
import TextSummarizer from "../text-summarizer/page";
describe("Text Summarizer", () => {
    it("renders", () => { render(<TextSummarizer />); expect(screen.getByText("📝 Text Summarizer")).toBeInTheDocument(); });
    it("shows Back link", () => { render(<TextSummarizer />); expect(screen.getByText("← Back")).toBeInTheDocument(); });
});
