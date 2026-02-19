"use client";
import { render, screen } from "@testing-library/react";
jest.mock("next/link", () => ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>);
import ColorPaletteGenerator from "../color-palette-generator/page";
describe("Color Palette Generator", () => {
    it("renders", () => { render(<ColorPaletteGenerator />); expect(screen.getByText(/Palette/i)).toBeInTheDocument(); });
    it("shows Back link", () => { render(<ColorPaletteGenerator />); expect(screen.getByText(/Back/)).toBeInTheDocument(); });
});
