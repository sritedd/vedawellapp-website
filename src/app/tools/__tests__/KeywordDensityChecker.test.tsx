"use client";
import { render, screen } from "@testing-library/react";
jest.mock("next/link", () => ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>);
import KeywordDensityChecker from "../keyword-density-checker/page";
describe("Keyword Density Checker", () => {
    it("renders", () => { render(<KeywordDensityChecker />); expect(screen.getByText("🔑 Keyword Density Checker")).toBeInTheDocument(); });
    it("shows Back link", () => { render(<KeywordDensityChecker />); expect(screen.getByText("← Back")).toBeInTheDocument(); });
});
