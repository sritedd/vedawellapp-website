"use client";
import { render, screen } from "@testing-library/react";
jest.mock("next/link", () => ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>);
import GradientGenerator from "../gradient-generator/page";
describe("Gradient Generator", () => {
    it("renders", () => { render(<GradientGenerator />); expect(screen.getByText(/Gradient Generator/)).toBeInTheDocument(); });
    it("shows Back link", () => { render(<GradientGenerator />); expect(screen.getByText("← Back")).toBeInTheDocument(); });
});
