"use client";
import { render, screen } from "@testing-library/react";
jest.mock("next/link", () => ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>);
import AspectRatioCalculator from "../aspect-ratio-calculator/page";
describe("Aspect Ratio Calculator", () => {
    it("renders", () => { render(<AspectRatioCalculator />); expect(screen.getByText("📐 Aspect Ratio Calculator")).toBeInTheDocument(); });
    it("shows Back link", () => { render(<AspectRatioCalculator />); expect(screen.getByText("← Back")).toBeInTheDocument(); });
});
