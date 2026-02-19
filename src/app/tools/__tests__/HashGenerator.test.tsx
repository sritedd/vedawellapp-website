"use client";

import { render, screen, fireEvent } from "@testing-library/react";
import HashGenerator from "../hash-generator/page";

// Mock Next.js Link component
jest.mock("next/link", () => {
    return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
        return <a href={href}>{children}</a>;
    };
});

describe("Hash Generator", () => {
    describe("Rendering", () => {
        it("renders with title", () => {
            render(<HashGenerator />);
            expect(screen.getByText("Hash Generator")).toBeInTheDocument();
        });

        it("shows input textarea", () => {
            render(<HashGenerator />);
            expect(screen.getByPlaceholderText(/Enter any text to generate/i)).toBeInTheDocument();
        });

        it("shows Generate Hashes button", () => {
            render(<HashGenerator />);
            expect(screen.getByText("Generate Hashes")).toBeInTheDocument();
        });

        it("button is disabled when input is empty", () => {
            render(<HashGenerator />);
            expect(screen.getByText("Generate Hashes")).toBeDisabled();
        });
    });

    describe("Hash Generation", () => {
        it("enables button when text is entered", () => {
            render(<HashGenerator />);
            const input = screen.getByPlaceholderText(/Enter any text to generate/i);
            fireEvent.change(input, { target: { value: "test" } });

            expect(screen.getByText("Generate Hashes")).not.toBeDisabled();
        });

        it("shows button text correctly", () => {
            render(<HashGenerator />);
            const input = screen.getByPlaceholderText(/Enter any text to generate/i);
            fireEvent.change(input, { target: { value: "test input" } });

            // Button should still say Generate Hashes
            expect(screen.getByText("Generate Hashes")).toBeInTheDocument();
        });
    });

    describe("Edge Cases", () => {
        it("shows Back link", () => {
            render(<HashGenerator />);
            expect(screen.getByText("← Back")).toBeInTheDocument();
        });

        it("shows Text to Hash label", () => {
            render(<HashGenerator />);
            expect(screen.getByText("Text to Hash")).toBeInTheDocument();
        });

        it("input is editable", () => {
            render(<HashGenerator />);
            const input = screen.getByPlaceholderText(/Enter any text to generate/i) as HTMLTextAreaElement;
            fireEvent.change(input, { target: { value: "hello world" } });

            expect(input.value).toBe("hello world");
        });
    });
});
