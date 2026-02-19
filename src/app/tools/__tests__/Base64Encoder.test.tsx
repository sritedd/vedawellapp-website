"use client";

import { render, screen, fireEvent } from "@testing-library/react";
import Base64Encoder from "../base64-encoder/page";

// Mock Next.js Link component
jest.mock("next/link", () => {
    return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
        return <a href={href}>{children}</a>;
    };
});

describe("Base64 Encoder", () => {
    describe("Rendering", () => {
        it("renders with title and description", () => {
            render(<Base64Encoder />);
            expect(screen.getByText(/Base64 Encoder/)).toBeInTheDocument();
            expect(screen.getByText(/Encode and decode text/i)).toBeInTheDocument();
        });

        it("shows mode toggle buttons", () => {
            render(<Base64Encoder />);
            expect(screen.getByRole("button", { name: /Encode/i })).toBeInTheDocument();
            expect(screen.getByRole("button", { name: /Decode/i })).toBeInTheDocument();
        });

        it("shows input and output areas", () => {
            render(<Base64Encoder />);
            expect(screen.getByPlaceholderText(/Enter text to encode/i)).toBeInTheDocument();
            expect(screen.getByText(/Output will appear here/)).toBeInTheDocument();
        });
    });

    describe("Encoding", () => {
        it("encodes 'Hello World' to 'SGVsbG8gV29ybGQ='", () => {
            render(<Base64Encoder />);
            const input = screen.getByPlaceholderText(/Enter text to encode/i);

            fireEvent.change(input, { target: { value: "Hello World" } });

            expect(screen.getByText("SGVsbG8gV29ybGQ=")).toBeInTheDocument();
        });

        it("encodes empty string to nothing", () => {
            render(<Base64Encoder />);
            const input = screen.getByPlaceholderText(/Enter text to encode/i);

            fireEvent.change(input, { target: { value: "" } });

            expect(screen.getByText(/Output will appear here/)).toBeInTheDocument();
        });

        it("encodes special characters correctly", () => {
            render(<Base64Encoder />);
            const input = screen.getByPlaceholderText(/Enter text to encode/i);

            fireEvent.change(input, { target: { value: "Hello\nWorld" } });

            // "Hello\nWorld" in Base64
            expect(screen.getByText("SGVsbG8KV29ybGQ=")).toBeInTheDocument();
        });

        it("encodes unicode characters correctly", () => {
            render(<Base64Encoder />);
            const input = screen.getByPlaceholderText(/Enter text to encode/i);

            fireEvent.change(input, { target: { value: "こんにちは" } });

            // Should encode without error
            expect(screen.queryByText(/Output will appear here/)).not.toBeInTheDocument();
        });
    });

    describe("Decoding", () => {
        it("switches to decode mode", () => {
            render(<Base64Encoder />);
            const decodeBtn = screen.getByRole("button", { name: /^Decode$/i });
            fireEvent.click(decodeBtn);

            expect(screen.getByPlaceholderText(/Paste Base64 string/i)).toBeInTheDocument();
        });

        it("decodes 'SGVsbG8gV29ybGQ=' to 'Hello World'", () => {
            render(<Base64Encoder />);
            const decodeBtn = screen.getByRole("button", { name: /^Decode$/i });
            fireEvent.click(decodeBtn);

            const input = screen.getByPlaceholderText(/Paste Base64 string/i);
            fireEvent.change(input, { target: { value: "SGVsbG8gV29ybGQ=" } });

            expect(screen.getByText("Hello World")).toBeInTheDocument();
        });

        it("shows error for invalid Base64", () => {
            render(<Base64Encoder />);
            const decodeBtn = screen.getByRole("button", { name: /^Decode$/i });
            fireEvent.click(decodeBtn);

            const input = screen.getByPlaceholderText(/Paste Base64 string/i);
            fireEvent.change(input, { target: { value: "!!invalid!!" } });

            expect(screen.getByText(/Invalid Base64 string/i)).toBeInTheDocument();
        });
    });

    describe("Mode Switching", () => {
        it("clears input when switching modes", () => {
            render(<Base64Encoder />);
            const encodeInput = screen.getByPlaceholderText(/Enter text to encode/i);
            fireEvent.change(encodeInput, { target: { value: "test" } });

            const decodeBtn = screen.getByRole("button", { name: /^Decode$/i });
            fireEvent.click(decodeBtn);

            const decodeInput = screen.getByPlaceholderText(/Paste Base64 string/i) as HTMLTextAreaElement;
            expect(decodeInput.value).toBe("");
        });
    });

    describe("Edge Cases", () => {
        it("handles very long strings", () => {
            render(<Base64Encoder />);
            const input = screen.getByPlaceholderText(/Enter text to encode/i);
            const longString = "a".repeat(1000);

            fireEvent.change(input, { target: { value: longString } });

            // Should show character count
            expect(screen.getByText(/Input: 1000 chars/)).toBeInTheDocument();
        });

        it("handles whitespace-only input", () => {
            render(<Base64Encoder />);
            const input = screen.getByPlaceholderText(/Enter text to encode/i);

            fireEvent.change(input, { target: { value: "   " } });

            // "   " in Base64 is "ICAg"
            expect(screen.getByText("ICAg")).toBeInTheDocument();
        });
    });

    describe("Copy Functionality", () => {
        it("shows copy button when output is present", () => {
            render(<Base64Encoder />);
            const input = screen.getByPlaceholderText(/Enter text to encode/i);

            fireEvent.change(input, { target: { value: "test" } });

            expect(screen.getByText("Copy")).toBeInTheDocument();
        });

        it("calls clipboard.writeText on copy click", async () => {
            render(<Base64Encoder />);
            const input = screen.getByPlaceholderText(/Enter text to encode/i);

            fireEvent.change(input, { target: { value: "test" } });
            fireEvent.click(screen.getByText("Copy"));

            expect(navigator.clipboard.writeText).toHaveBeenCalled();
        });
    });

    describe("Statistics", () => {
        it("shows input and output character counts", () => {
            render(<Base64Encoder />);
            const input = screen.getByPlaceholderText(/Enter text to encode/i);

            fireEvent.change(input, { target: { value: "Hello" } });

            expect(screen.getByText(/Input: 5 chars/)).toBeInTheDocument();
            expect(screen.getByText(/Output: 8 chars/)).toBeInTheDocument();
        });

        it("shows size increase percentage", () => {
            render(<Base64Encoder />);
            const input = screen.getByPlaceholderText(/Enter text to encode/i);

            fireEvent.change(input, { target: { value: "Hello World" } });

            expect(screen.getByText(/Size increase:/)).toBeInTheDocument();
        });
    });
});
