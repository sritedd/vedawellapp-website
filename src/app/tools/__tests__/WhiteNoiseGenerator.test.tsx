"use client";
import { render, screen } from "@testing-library/react";
jest.mock("next/link", () => ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>);
import WhiteNoiseGenerator from "../white-noise-generator/page";
describe("White Noise Generator", () => {
    it("renders", () => { render(<WhiteNoiseGenerator />); expect(screen.getByText("🔉 White Noise Generator")).toBeInTheDocument(); });
    it("shows Back link", () => { render(<WhiteNoiseGenerator />); expect(screen.getByText("← Back")).toBeInTheDocument(); });
});
