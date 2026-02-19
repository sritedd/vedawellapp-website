"use client";

import { render, screen, fireEvent } from "@testing-library/react";
import UUIDGenerator from "../uuid-generator/page";

// Mock Next.js Link component
jest.mock("next/link", () => {
    return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
        return <a href={href}>{children}</a>;
    };
});

describe("UUID Generator", () => {
    describe("Rendering", () => {
        it("renders with title", () => {
            render(<UUIDGenerator />);
            expect(screen.getByText("UUID Generator")).toBeInTheDocument();
        });

        it("shows Generate UUIDs button", () => {
            render(<UUIDGenerator />);
            expect(screen.getByText("Generate UUIDs")).toBeInTheDocument();
        });

        it("shows Version selector", () => {
            render(<UUIDGenerator />);
            expect(screen.getByText("Version")).toBeInTheDocument();
            // UUID v4/v7 appear in both buttons and info section
            const v4Elements = screen.getAllByText("UUID v4");
            const v7Elements = screen.getAllByText("UUID v7");
            expect(v4Elements.length).toBeGreaterThan(0);
            expect(v7Elements.length).toBeGreaterThan(0);
        });

        it("shows Format selector", () => {
            render(<UUIDGenerator />);
            expect(screen.getByText("Format")).toBeInTheDocument();
        });

        it("shows Count input", () => {
            render(<UUIDGenerator />);
            expect(screen.getByText("Count")).toBeInTheDocument();
        });
    });

    describe("UUID Generation", () => {
        it("generates UUIDs when button clicked", () => {
            render(<UUIDGenerator />);
            fireEvent.click(screen.getByText("Generate UUIDs"));

            // Should show Generated UUIDs section
            expect(screen.getByText("Generated UUIDs")).toBeInTheDocument();
        });

        it("generates correct number of UUIDs", () => {
            render(<UUIDGenerator />);
            fireEvent.click(screen.getByText("Generate UUIDs"));

            // Default count is 5
            const uuidPattern = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
            const codeElements = screen.getAllByText(uuidPattern);
            expect(codeElements.length).toBe(5);
        });

        it("generates valid v4 UUID format", () => {
            render(<UUIDGenerator />);
            fireEvent.click(screen.getByText("Generate UUIDs"));

            // v4 UUID has specific version digit in position 14 (after removing dashes)
            const uuidPattern = /[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i;
            const codeElements = screen.getAllByText(uuidPattern);
            expect(codeElements.length).toBeGreaterThan(0);
        });
    });

    describe("Version Selection", () => {
        it("can switch to UUID v7", () => {
            render(<UUIDGenerator />);
            // Get all buttons and find the v7 button
            const buttons = screen.getAllByRole("button");
            const v7Button = buttons.find(btn => btn.textContent === "UUID v7");
            if (v7Button) {
                fireEvent.click(v7Button);
            }
            fireEvent.click(screen.getByText("Generate UUIDs"));

            // Should generate UUIDs (v7 has different format)
            expect(screen.getByText("Generated UUIDs")).toBeInTheDocument();
        });
    });

    describe("Format Options", () => {
        it("can select uppercase format", () => {
            render(<UUIDGenerator />);
            const formatSelect = screen.getByRole("combobox");

            fireEvent.change(formatSelect, { target: { value: "uppercase" } });
            fireEvent.click(screen.getByText("Generate UUIDs"));

            // Check that UUIDs are uppercase
            const uppercasePattern = /[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}/;
            const elements = screen.getAllByText(uppercasePattern);
            expect(elements.length).toBeGreaterThan(0);
        });
    });

    describe("Copy Functionality", () => {
        it("shows Copy All button after generation", () => {
            render(<UUIDGenerator />);
            fireEvent.click(screen.getByText("Generate UUIDs"));

            expect(screen.getByText("Copy All")).toBeInTheDocument();
        });

        it("copies all UUIDs when Copy All clicked", () => {
            render(<UUIDGenerator />);
            fireEvent.click(screen.getByText("Generate UUIDs"));
            fireEvent.click(screen.getByText("Copy All"));

            expect(navigator.clipboard.writeText).toHaveBeenCalled();
        });
    });

    describe("Info Section", () => {
        it("shows UUID v4 info", () => {
            render(<UUIDGenerator />);
            expect(screen.getByText(/Random UUID/i)).toBeInTheDocument();
        });

        it("shows UUID v7 info", () => {
            render(<UUIDGenerator />);
            expect(screen.getByText(/Time-ordered UUID/i)).toBeInTheDocument();
        });
    });
});
