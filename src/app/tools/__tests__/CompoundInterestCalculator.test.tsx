"use client";
import { render, screen } from "@testing-library/react";
jest.mock("next/link", () => ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>);
import CompoundInterestCalculator from "../compound-interest-calculator/page";
describe("Compound Interest Calculator", () => {
    it("renders", () => { render(<CompoundInterestCalculator />); expect(screen.getByText(/Compound Interest Calculator/)).toBeInTheDocument(); });
    it("shows Back link", () => { render(<CompoundInterestCalculator />); expect(screen.getByText("← Back")).toBeInTheDocument(); });
});
