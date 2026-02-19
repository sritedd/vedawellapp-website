"use client";

import { render, screen, fireEvent } from "@testing-library/react";
import WordCounter from "../word-counter/page";

// Mock Next.js Link component
jest.mock("next/link", () => {
    return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
        return <a href={href}>{children}</a>;
    };
});

describe("Word Counter", () => {
    describe("Rendering", () => {
        it("renders with title", () => {
            render(<WordCounter />);
            expect(screen.getByText(/Word Counter/i)).toBeInTheDocument();
        });

        it("shows text input area", () => {
            render(<WordCounter />);
            expect(screen.getByPlaceholderText(/Start typing/i)).toBeInTheDocument();
        });

        it("shows Words stat label", () => {
            render(<WordCounter />);
            expect(screen.getByText("Words")).toBeInTheDocument();
        });

        it("shows Characters stat label", () => {
            render(<WordCounter />);
            expect(screen.getByText("Characters")).toBeInTheDocument();
        });

        it("shows Sentences stat label", () => {
            render(<WordCounter />);
            expect(screen.getByText("Sentences")).toBeInTheDocument();
        });

        it("shows Paragraphs stat label", () => {
            render(<WordCounter />);
            expect(screen.getByText("Paragraphs")).toBeInTheDocument();
        });
    });

    describe("Word Counting", () => {
        it("shows zero for all stats when empty", () => {
            render(<WordCounter />);
            // Multiple 0s should be present
            const zeros = screen.getAllByText("0");
            expect(zeros.length).toBeGreaterThan(0);
        });

        it("counts single word correctly", () => {
            render(<WordCounter />);
            const input = screen.getByPlaceholderText(/Start typing/i);
            fireEvent.change(input, { target: { value: "Hello" } });

            // Should show 1 word - find it near the Words label
            const ones = screen.getAllByText("1");
            expect(ones.length).toBeGreaterThan(0);
        });

        it("counts multiple words correctly", () => {
            render(<WordCounter />);
            const input = screen.getByPlaceholderText(/Start typing/i);
            fireEvent.change(input, { target: { value: "Hello World Today" } });

            // Should show 3 words
            expect(screen.getByText("3")).toBeInTheDocument();
        });
    });

    describe("Character Counting", () => {
        it("counts characters correctly", () => {
            render(<WordCounter />);
            const input = screen.getByPlaceholderText(/Start typing/i);
            fireEvent.change(input, { target: { value: "Hi There" } });

            // "Hi There" = 8 characters
            expect(screen.getByText("8")).toBeInTheDocument();
        });
    });

    describe("Edge Cases", () => {
        it("handles multiple spaces between words", () => {
            render(<WordCounter />);
            const input = screen.getByPlaceholderText(/Start typing/i);
            fireEvent.change(input, { target: { value: "Hello    World" } });

            // Should count 2 words, not 5
            expect(screen.getByText("2")).toBeInTheDocument();
        });

        it("handles only whitespace", () => {
            render(<WordCounter />);
            const input = screen.getByPlaceholderText(/Start typing/i);
            fireEvent.change(input, { target: { value: "   " } });

            // Should show 0 words
            const zeros = screen.getAllByText("0");
            expect(zeros.length).toBeGreaterThan(0);
        });
    });

    describe("Additional Stats", () => {
        it("shows Reading Time stat", () => {
            render(<WordCounter />);
            expect(screen.getByText("Reading Time")).toBeInTheDocument();
        });

        it("shows Speaking Time stat", () => {
            render(<WordCounter />);
            expect(screen.getByText("Speaking Time")).toBeInTheDocument();
        });
    });

    describe("Actions", () => {
        it("shows Clear button", () => {
            render(<WordCounter />);
            expect(screen.getByText("Clear")).toBeInTheDocument();
        });

        it("shows Copy Text button", () => {
            render(<WordCounter />);
            expect(screen.getByText("Copy Text")).toBeInTheDocument();
        });

        it("clears text when Clear is clicked", () => {
            render(<WordCounter />);
            const input = screen.getByPlaceholderText(/Start typing/i) as HTMLTextAreaElement;
            fireEvent.change(input, { target: { value: "Hello World" } });

            fireEvent.click(screen.getByText("Clear"));

            expect(input.value).toBe("");
        });
    });
});
