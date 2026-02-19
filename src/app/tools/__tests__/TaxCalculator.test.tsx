"use client";
import { render, screen } from "@testing-library/react";
jest.mock("next/link", () => ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>);
import TaxCalculator from "../tax-calculator/page";
describe("Tax Calculator", () => {
    it("renders", () => { render(<TaxCalculator />); expect(screen.getByText("💰 Tax Calculator")).toBeInTheDocument(); });
    it("shows Back link", () => { render(<TaxCalculator />); expect(screen.getByText("← Back")).toBeInTheDocument(); });
});
