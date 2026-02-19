"use client";

import { render, screen, fireEvent } from "@testing-library/react";
import LoanCalculator from "../loan-calculator/page";

// Mock ToolLayout component
jest.mock("@/components/tools/ToolLayout", () => {
    return function MockToolLayout({ children, title, description }: { children: React.ReactNode; title: string; description: string }) {
        return (
            <div data-testid="tool-layout">
                <h1>{title}</h1>
                <p>{description}</p>
                {children}
            </div>
        );
    };
});

describe("Loan Calculator", () => {
    describe("Rendering", () => {
        it("renders with title", () => {
            render(<LoanCalculator />);
            expect(screen.getByText("Loan Calculator")).toBeInTheDocument();
        });

        it("shows loan amount input", () => {
            render(<LoanCalculator />);
            expect(screen.getByText(/Loan Amount/i)).toBeInTheDocument();
        });

        it("shows interest rate input", () => {
            render(<LoanCalculator />);
            expect(screen.getByText(/Interest Rate/i)).toBeInTheDocument();
        });

        it("shows loan term input", () => {
            render(<LoanCalculator />);
            expect(screen.getByText(/Loan Term/i)).toBeInTheDocument();
        });

        it("shows Monthly Payment label", () => {
            render(<LoanCalculator />);
            expect(screen.getByText("Monthly Payment")).toBeInTheDocument();
        });

        it("shows Total Payment label", () => {
            render(<LoanCalculator />);
            expect(screen.getByText("Total Payment")).toBeInTheDocument();
        });

        it("shows Total Interest label", () => {
            render(<LoanCalculator />);
            expect(screen.getByText("Total Interest")).toBeInTheDocument();
        });
    });

    describe("Default Values Calculation", () => {
        it("calculates with default values (250000, 6.5%, 30 years)", () => {
            render(<LoanCalculator />);
            // Default: $250,000 at 6.5% for 30 years = ~$1,580/month
            expect(screen.getByText(/\$1,580/)).toBeInTheDocument();
        });
    });

    describe("Input Changes", () => {
        it("updates calculation when amount changes", () => {
            render(<LoanCalculator />);
            const inputs = screen.getAllByRole("spinbutton");
            // Amount is the first input
            fireEvent.change(inputs[0], { target: { value: "500000" } });

            // Monthly payment should roughly double
            expect(screen.getByText(/\$3,160/)).toBeInTheDocument();
        });

        it("updates calculation when rate changes", () => {
            render(<LoanCalculator />);
            const inputs = screen.getAllByRole("spinbutton");
            // Rate is the second input
            fireEvent.change(inputs[1], { target: { value: "5" } });

            // Lower rate = lower payment
            // $250,000 at 5% for 30 years = ~$1,342/month
            expect(screen.getByText(/\$1,342/)).toBeInTheDocument();
        });
    });

    describe("Edge Cases", () => {
        it("handles zero interest rate", () => {
            render(<LoanCalculator />);
            const inputs = screen.getAllByRole("spinbutton");
            // Rate is second input  
            fireEvent.change(inputs[1], { target: { value: "0" } });

            // 0% interest: $250,000 / 360 months = ~$694/month
            expect(screen.getByText(/\$694/)).toBeInTheDocument();
        });

        it("shows Principal and Interest legend", () => {
            render(<LoanCalculator />);
            expect(screen.getByText("Principal")).toBeInTheDocument();
            expect(screen.getByText("Interest")).toBeInTheDocument();
        });
    });
});
