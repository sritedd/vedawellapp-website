"use client";

import { render, screen, fireEvent } from "@testing-library/react";
import CaseConverter from "../case-converter/page";

// Mock Next.js Link component
jest.mock("next/link", () => {
    return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
        return <a href={href}>{children}</a>;
    };
});

describe("Case Converter", () => {
    describe("Rendering", () => {
        it("renders with title", () => {
            render(<CaseConverter />);
            expect(screen.getByText(/Case Converter/i)).toBeInTheDocument();
        });

        it("shows text input area", () => {
            render(<CaseConverter />);
            expect(screen.getByPlaceholderText(/Type or paste/i)).toBeInTheDocument();
        });

        it("shows conversion options", () => {
            render(<CaseConverter />);
            expect(screen.getByText("UPPERCASE")).toBeInTheDocument();
            expect(screen.getByText("lowercase")).toBeInTheDocument();
            expect(screen.getByText("Title Case")).toBeInTheDocument();
        });
    });

    describe("Case Conversions", () => {
        it("shows uppercase conversion result", () => {
            render(<CaseConverter />);
            const input = screen.getByPlaceholderText(/Type or paste/i);
            fireEvent.change(input, { target: { value: "hello world" } });

            // Find the UPPERCASE card and check its result
            const uppercaseLabel = screen.getByText("UPPERCASE");
            const card = uppercaseLabel.closest("div")?.parentElement;
            expect(card).toHaveTextContent("HELLO WORLD");
        });

        it("shows lowercase conversion result", () => {
            render(<CaseConverter />);
            const input = screen.getByPlaceholderText(/Type or paste/i);
            fireEvent.change(input, { target: { value: "HELLO WORLD" } });

            const lowercaseLabel = screen.getByText("lowercase");
            const card = lowercaseLabel.closest("div")?.parentElement;
            expect(card).toHaveTextContent("hello world");
        });

        it("shows title case conversion result", () => {
            render(<CaseConverter />);
            const input = screen.getByPlaceholderText(/Type or paste/i);
            fireEvent.change(input, { target: { value: "hello world" } });

            const titleCaseLabel = screen.getByText("Title Case");
            const card = titleCaseLabel.closest("div")?.parentElement;
            expect(card).toHaveTextContent("Hello World");
        });

        it("shows camelCase conversion result", () => {
            render(<CaseConverter />);
            const input = screen.getByPlaceholderText(/Type or paste/i);
            fireEvent.change(input, { target: { value: "hello world test" } });

            const camelCaseLabel = screen.getByText("camelCase");
            const card = camelCaseLabel.closest("div")?.parentElement;
            expect(card).toHaveTextContent("helloWorldTest");
        });

        it("shows snake_case conversion result", () => {
            render(<CaseConverter />);
            const input = screen.getByPlaceholderText(/Type or paste/i);
            fireEvent.change(input, { target: { value: "hello world test" } });

            const snakeCaseLabel = screen.getByText("snake_case");
            const card = snakeCaseLabel.closest("div")?.parentElement;
            expect(card).toHaveTextContent("hello_world_test");
        });

        it("shows kebab-case conversion result", () => {
            render(<CaseConverter />);
            const input = screen.getByPlaceholderText(/Type or paste/i);
            fireEvent.change(input, { target: { value: "hello world test" } });

            const kebabCaseLabel = screen.getByText("kebab-case");
            const card = kebabCaseLabel.closest("div")?.parentElement;
            expect(card).toHaveTextContent("hello-world-test");
        });
    });

    describe("Edge Cases", () => {
        it("shows placeholder when input is empty", () => {
            render(<CaseConverter />);
            // Each conversion card shows "-" when empty
            const uppercaseLabel = screen.getByText("UPPERCASE");
            const card = uppercaseLabel.closest("div")?.parentElement;
            expect(card).toHaveTextContent("-");
        });

        it("handles numbers in text", () => {
            render(<CaseConverter />);
            const input = screen.getByPlaceholderText(/Type or paste/i);
            fireEvent.change(input, { target: { value: "hello123world" } });

            const uppercaseLabel = screen.getByText("UPPERCASE");
            const card = uppercaseLabel.closest("div")?.parentElement;
            expect(card).toHaveTextContent("HELLO123WORLD");
        });
    });

    describe("Copy Functionality", () => {
        it("has copy buttons for each conversion", () => {
            render(<CaseConverter />);
            const copyButtons = screen.getAllByText("Copy");
            expect(copyButtons.length).toBeGreaterThan(0);
        });

        it("copies to clipboard when clicked", () => {
            render(<CaseConverter />);
            const input = screen.getByPlaceholderText(/Type or paste/i);
            fireEvent.change(input, { target: { value: "test" } });

            const copyButtons = screen.getAllByText("Copy");
            fireEvent.click(copyButtons[0]);

            expect(navigator.clipboard.writeText).toHaveBeenCalled();
        });
    });
});
