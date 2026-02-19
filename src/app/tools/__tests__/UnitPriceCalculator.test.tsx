"use client";
import { render, screen } from "@testing-library/react";
jest.mock("next/link", () => ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>);
import UnitPriceCalculator from "../unit-price-calculator/page";
describe("Unit Price Calculator", () => {
    it("renders", () => { render(<UnitPriceCalculator />); expect(screen.getByText(/Unit Price/i)).toBeInTheDocument(); });
    it("shows Back link", () => { render(<UnitPriceCalculator />); expect(screen.getByText(/Back/)).toBeInTheDocument(); });
});
