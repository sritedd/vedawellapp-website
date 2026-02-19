"use client";
import { render, screen, fireEvent } from "@testing-library/react";
import UnitConverter from "../unit-converter/page";

jest.mock("next/link", () => ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>);

describe("Unit Converter", () => {
    it("renders with title", () => { render(<UnitConverter />); expect(screen.getByText("📏 Unit Converter")).toBeInTheDocument(); });
    it("shows All Tools link", () => { render(<UnitConverter />); expect(screen.getByText("← All Tools")).toBeInTheDocument(); });
    it("shows Length category", () => { render(<UnitConverter />); expect(screen.getByRole("button", { name: "Length" })).toBeInTheDocument(); });
    it("shows From label", () => { render(<UnitConverter />); expect(screen.getByText("From")).toBeInTheDocument(); });
    it("shows To label", () => { render(<UnitConverter />); expect(screen.getByText("To")).toBeInTheDocument(); });
});
