"use client";
import { render, screen } from "@testing-library/react";
jest.mock("next/link", () => ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>);
import MortgageCalculator from "../mortgage-calculator/page";
describe("Mortgage Calculator", () => {
    it("renders", () => { render(<MortgageCalculator />); expect(screen.getByText(/Mortgage/i)).toBeInTheDocument(); });
    it("shows Back link", () => { render(<MortgageCalculator />); expect(screen.getByText(/Back/)).toBeInTheDocument(); });
});
