"use client";
import { render, screen } from "@testing-library/react";
jest.mock("next/link", () => ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>);
import HtmlCleaner from "../html-cleaner/page";
describe("HTML Cleaner", () => {
    it("renders", () => { render(<HtmlCleaner />); expect(screen.getByText("🧹 HTML Cleaner")).toBeInTheDocument(); });
    it("shows Back link", () => { render(<HtmlCleaner />); expect(screen.getByText("← Back")).toBeInTheDocument(); });
});
