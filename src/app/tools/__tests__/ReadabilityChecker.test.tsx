"use client";
import { render, screen } from "@testing-library/react";
jest.mock("next/link", () => ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>);
import ReadabilityChecker from "../readability-checker/page";
describe("Readability Checker", () => {
    it("renders", () => { render(<ReadabilityChecker />); expect(screen.getByText(/Readability/i)).toBeInTheDocument(); });
    it("shows Back link", () => { render(<ReadabilityChecker />); expect(screen.getByText(/Back/)).toBeInTheDocument(); });
});
