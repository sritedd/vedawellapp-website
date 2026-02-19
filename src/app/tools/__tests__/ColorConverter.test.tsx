"use client";
import { render, screen, fireEvent } from "@testing-library/react";
import ColorConverter from "../color-converter/page";

jest.mock("next/link", () => ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>);

describe("Color Converter", () => {
    it("renders with title", () => { render(<ColorConverter />); expect(screen.getByText("🎨 Color Converter")).toBeInTheDocument(); });
    it("shows HEX format", () => { render(<ColorConverter />); expect(screen.getByText("HEX")).toBeInTheDocument(); });
    it("shows RGB format", () => { render(<ColorConverter />); expect(screen.getByText("RGB")).toBeInTheDocument(); });
    it("shows HSL format", () => { render(<ColorConverter />); expect(screen.getByText("HSL")).toBeInTheDocument(); });
    it("shows RGBA format", () => { render(<ColorConverter />); expect(screen.getByText("RGBA")).toBeInTheDocument(); });
    it("shows Red slider", () => { render(<ColorConverter />); expect(screen.getByText("Red")).toBeInTheDocument(); });
    it("shows Green slider", () => { render(<ColorConverter />); expect(screen.getByText("Green")).toBeInTheDocument(); });
    it("shows Blue slider", () => { render(<ColorConverter />); expect(screen.getByText("Blue")).toBeInTheDocument(); });
    it("shows Hue slider", () => { render(<ColorConverter />); expect(screen.getByText("Hue")).toBeInTheDocument(); });
    it("shows Adjust Values section", () => { render(<ColorConverter />); expect(screen.getByText("Adjust Values")).toBeInTheDocument(); });
    it("shows All Tools link", () => { render(<ColorConverter />); expect(screen.getByText("← All Tools")).toBeInTheDocument(); });
    it("has Copy buttons", () => { render(<ColorConverter />); const copyButtons = screen.getAllByText("Copy"); expect(copyButtons.length).toBeGreaterThan(0); });
});
