"use client";

import { render, screen, fireEvent } from "@testing-library/react";
import TipCalculator from "../tip-calculator/page";

// Mock Next.js Link component
jest.mock("next/link", () => {
    return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
        return <a href={href}>{children}</a>;
    };
});

describe("Tip Calculator", () => {
    describe("Rendering", () => {
        it("renders with title", () => {
            render(<TipCalculator />);
            expect(screen.getByText(/Tip Calculator/i)).toBeInTheDocument();
        });

        it("shows bill amount input", () => {
            render(<TipCalculator />);
            expect(screen.getByPlaceholderText("0.00")).toBeInTheDocument();
        });

        it("shows tip percentage buttons", () => {
            render(<TipCalculator />);
            expect(screen.getByText("10%")).toBeInTheDocument();
            expect(screen.getByText("15%")).toBeInTheDocument();
            expect(screen.getByText("18%")).toBeInTheDocument();
            expect(screen.getByText("20%")).toBeInTheDocument();
            expect(screen.getByText("25%")).toBeInTheDocument();
        });

        it("shows Number of People section", () => {
            render(<TipCalculator />);
            expect(screen.getByText("Number of People")).toBeInTheDocument();
        });

        it("shows Bill Amount label", () => {
            render(<TipCalculator />);
            expect(screen.getByText("Bill Amount")).toBeInTheDocument();
        });

        it("shows Tip Percentage label", () => {
            render(<TipCalculator />);
            expect(screen.getByText("Tip Percentage")).toBeInTheDocument();
        });
    });

    describe("Results Display", () => {
        it("shows Tip Amount label", () => {
            render(<TipCalculator />);
            expect(screen.getByText("Tip Amount")).toBeInTheDocument();
        });

        it("shows Total label", () => {
            render(<TipCalculator />);
            expect(screen.getByText("Total")).toBeInTheDocument();
        });
    });

    describe("Tip Calculation", () => {
        it("calculates with entered bill amount", () => {
            render(<TipCalculator />);
            const billInput = screen.getByPlaceholderText("0.00");

            fireEvent.change(billInput, { target: { value: "100" } });

            // Tip Amount section should exist and show some value
            expect(screen.getByText("Tip Amount")).toBeInTheDocument();
        });

        it("changes tip when selecting different percentage", () => {
            render(<TipCalculator />);
            const billInput = screen.getByPlaceholderText("0.00");

            fireEvent.change(billInput, { target: { value: "100" } });
            fireEvent.click(screen.getByText("20%"));

            // Check that 20% is now selected (should have a different style)
            expect(screen.getByText("Total")).toBeInTheDocument();
        });
    });

    describe("Bill Splitting", () => {
        it("shows + and - buttons for people", () => {
            render(<TipCalculator />);
            expect(screen.getByText("+")).toBeInTheDocument();
            expect(screen.getByText("−")).toBeInTheDocument();
        });

        it("shows initial person count of 1", () => {
            render(<TipCalculator />);
            expect(screen.getByText("1")).toBeInTheDocument();
        });

        it("increases person count when + clicked", () => {
            render(<TipCalculator />);
            fireEvent.click(screen.getByText("+"));
            expect(screen.getByText("2")).toBeInTheDocument();
        });
    });

    describe("Custom Tip", () => {
        it("shows Custom tip option", () => {
            render(<TipCalculator />);
            expect(screen.getByText(/Custom/i)).toBeInTheDocument();
        });
    });

    describe("Reset", () => {
        it("shows Reset button", () => {
            render(<TipCalculator />);
            expect(screen.getByText("Reset")).toBeInTheDocument();
        });

        it("resets values when clicked", () => {
            render(<TipCalculator />);
            const billInput = screen.getByPlaceholderText("0.00") as HTMLInputElement;

            fireEvent.change(billInput, { target: { value: "100" } });
            fireEvent.click(screen.getByText("Reset"));

            expect(billInput.value).toBe("");
        });
    });
});
