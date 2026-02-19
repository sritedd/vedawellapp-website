"use client";
import { render, screen } from "@testing-library/react";
jest.mock("next/link", () => ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>);
import DateCalculator from "../date-calculator/page";
describe("Date Calculator", () => {
    it("renders", () => { render(<DateCalculator />); expect(screen.getByText(/Date Calculator/i)).toBeInTheDocument(); });
    it("shows Back link", () => { render(<DateCalculator />); expect(screen.getByText(/Back/)).toBeInTheDocument(); });
});
