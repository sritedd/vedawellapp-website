"use client";
import { render, screen } from "@testing-library/react";
jest.mock("next/link", () => ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>);
import ScientificCalculator from "../scientific-calculator/page";
describe("Scientific Calculator", () => {
    it("renders", () => { render(<ScientificCalculator />); expect(screen.getByText(/Calculator/i)).toBeInTheDocument(); });
    it("shows Back link", () => { render(<ScientificCalculator />); expect(screen.getByText(/Back/)).toBeInTheDocument(); });
});
