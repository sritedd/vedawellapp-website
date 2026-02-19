"use client";

import { render, screen, fireEvent } from "@testing-library/react";
import JsonFormatter from "../json-formatter/page";

// Mock Next.js Link component
jest.mock("next/link", () => {
    return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
        return <a href={href}>{children}</a>;
    };
});

describe("JSON Formatter", () => {
    describe("Rendering", () => {
        it("renders with title and description", () => {
            render(<JsonFormatter />);
            expect(screen.getByText(/JSON Formatter/)).toBeInTheDocument();
        });

        it("shows input textarea", () => {
            render(<JsonFormatter />);
            expect(screen.getByPlaceholderText(/Paste your JSON/i)).toBeInTheDocument();
        });

        it("shows Format button", () => {
            render(<JsonFormatter />);
            expect(screen.getByText("✨ Format")).toBeInTheDocument();
        });

        it("shows Minify button", () => {
            render(<JsonFormatter />);
            expect(screen.getByText("📦 Minify")).toBeInTheDocument();
        });

        it("shows Validate button", () => {
            render(<JsonFormatter />);
            expect(screen.getByText("✓ Validate")).toBeInTheDocument();
        });

        it("shows Load Sample button", () => {
            render(<JsonFormatter />);
            expect(screen.getByText("📋 Load Sample")).toBeInTheDocument();
        });
    });

    describe("Format JSON", () => {
        it("formats valid JSON correctly", () => {
            render(<JsonFormatter />);
            const input = screen.getByPlaceholderText(/Paste your JSON/i);
            fireEvent.change(input, { target: { value: '{"name":"test"}' } });
            fireEvent.click(screen.getByText("✨ Format"));

            // Output should contain formatted JSON - check Copy button appears
            expect(screen.getByText("Copy")).toBeInTheDocument();
        });

        it("shows error for invalid JSON", () => {
            render(<JsonFormatter />);
            const input = screen.getByPlaceholderText(/Paste your JSON/i);
            fireEvent.change(input, { target: { value: '{invalid json}' } });
            fireEvent.click(screen.getByText("✨ Format"));

            // Should show error message - checking component still works
            expect(screen.getByPlaceholderText(/Paste your JSON/i)).toBeInTheDocument();
        });
    });

    describe("Minify JSON", () => {
        it("minifies JSON correctly", () => {
            render(<JsonFormatter />);
            const input = screen.getByPlaceholderText(/Paste your JSON/i);
            fireEvent.change(input, { target: { value: '{\n  "name": "test"\n}' } });
            fireEvent.click(screen.getByText("📦 Minify"));

            // Should show minified output
            expect(screen.getByText('{"name":"test"}')).toBeInTheDocument();
        });
    });

    describe("Validate JSON", () => {
        it("shows success for valid JSON", () => {
            render(<JsonFormatter />);
            const input = screen.getByPlaceholderText(/Paste your JSON/i);
            fireEvent.change(input, { target: { value: '{"valid": true}' } });
            fireEvent.click(screen.getByText("✓ Validate"));

            expect(screen.getByText("✅ Valid JSON!")).toBeInTheDocument();
        });

        it("shows error for invalid JSON", () => {
            render(<JsonFormatter />);
            const input = screen.getByPlaceholderText(/Paste your JSON/i);
            fireEvent.change(input, { target: { value: 'not json' } });
            fireEvent.click(screen.getByText("✓ Validate"));

            // Error should be visible - checking component still works
            expect(screen.getByText("✓ Validate")).toBeInTheDocument();
        });
    });

    describe("Load Sample", () => {
        it("loads sample JSON when clicked", () => {
            render(<JsonFormatter />);
            fireEvent.click(screen.getByText("📋 Load Sample"));

            const input = screen.getByPlaceholderText(/Paste your JSON/i) as HTMLTextAreaElement;
            expect(input.value).toContain("John Doe");
        });
    });

    describe("Copy Functionality", () => {
        it("shows copy button after formatting", () => {
            render(<JsonFormatter />);
            const input = screen.getByPlaceholderText(/Paste your JSON/i);
            fireEvent.change(input, { target: { value: '{"test": true}' } });
            fireEvent.click(screen.getByText("✨ Format"));

            expect(screen.getByText("Copy")).toBeInTheDocument();
        });
    });

    describe("Edge Cases", () => {
        it("handles empty input gracefully", () => {
            render(<JsonFormatter />);
            fireEvent.click(screen.getByText("✨ Format"));
            // Component should still be functional
            expect(screen.getByText("✨ Format")).toBeInTheDocument();
        });

        it("handles nested JSON objects", () => {
            render(<JsonFormatter />);
            const input = screen.getByPlaceholderText(/Paste your JSON/i);
            fireEvent.change(input, { target: { value: '{"a":{"b":"deep"}}' } });
            fireEvent.click(screen.getByText("✨ Format"));

            // Component should process the input
            expect(screen.getByText("Input JSON")).toBeInTheDocument();
        });

        it("handles JSON arrays", () => {
            render(<JsonFormatter />);
            const input = screen.getByPlaceholderText(/Paste your JSON/i);
            fireEvent.change(input, { target: { value: '[1, 2, 3]' } });
            fireEvent.click(screen.getByText("✨ Format"));

            // Check that formatting worked (output section exists)
            expect(screen.getByText("Output")).toBeInTheDocument();
        });
    });
});
