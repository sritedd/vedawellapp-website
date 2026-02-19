"use client";

import { render, screen, fireEvent } from "@testing-library/react";
import PercentageCalculator from "../percentage-calculator/page";

// Mock Next.js Link component
jest.mock("next/link", () => {
    return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
        return <a href={href}>{children}</a>;
    };
});

describe("Percentage Calculator", () => {
    describe("Rendering", () => {
        it("renders with title", () => {
            render(<PercentageCalculator />);
            expect(screen.getByText("📊 Percentage Calculator")).toBeInTheDocument();
        });

        it("shows Back link", () => {
            render(<PercentageCalculator />);
            expect(screen.getByText("← Back")).toBeInTheDocument();
        });

        it("shows What is X% of Y section", () => {
            render(<PercentageCalculator />);
            expect(screen.getByText("What is X% of Y?")).toBeInTheDocument();
        });

        it("shows X is what % of Y section", () => {
            render(<PercentageCalculator />);
            expect(screen.getByText("X is what % of Y?")).toBeInTheDocument();
        });

        it("shows Percentage Change section", () => {
            render(<PercentageCalculator />);
            expect(screen.getByText("Percentage Change")).toBeInTheDocument();
        });
    });

    describe("What is X% of Y Calculation", () => {
        it("calculates 10% of 100 = 10", () => {
            render(<PercentageCalculator />);
            const inputs = screen.getAllByRole("spinbutton");

            // First calculator inputs (percent, value)
            fireEvent.change(inputs[0], { target: { value: "10" } });
            fireEvent.change(inputs[1], { target: { value: "100" } });

            expect(screen.getByText("10.00")).toBeInTheDocument();
        });

        it("calculates 50% of 200 = 100", () => {
            render(<PercentageCalculator />);
            const inputs = screen.getAllByRole("spinbutton");

            fireEvent.change(inputs[0], { target: { value: "50" } });
            fireEvent.change(inputs[1], { target: { value: "200" } });

            expect(screen.getByText("100.00")).toBeInTheDocument();
        });

        it("shows 0 for empty inputs", () => {
            render(<PercentageCalculator />);
            expect(screen.getByText("0.00")).toBeInTheDocument();
        });
    });

    describe("X is what % of Y Calculation", () => {
        it("calculates 25 is what % of 100 = 25%", () => {
            render(<PercentageCalculator />);
            const inputs = screen.getAllByRole("spinbutton");

            // Second calculator inputs (part, whole)
            fireEvent.change(inputs[2], { target: { value: "25" } });
            fireEvent.change(inputs[3], { target: { value: "100" } });

            expect(screen.getByText("25.00%")).toBeInTheDocument();
        });

        it("calculates 50 is what % of 200 = 25%", () => {
            render(<PercentageCalculator />);
            const inputs = screen.getAllByRole("spinbutton");

            fireEvent.change(inputs[2], { target: { value: "50" } });
            fireEvent.change(inputs[3], { target: { value: "200" } });

            expect(screen.getByText("25.00%")).toBeInTheDocument();
        });
    });

    describe("Percentage Change Calculation", () => {
        it("calculates change from 100 to 150 = 50%", () => {
            render(<PercentageCalculator />);
            const inputs = screen.getAllByRole("spinbutton");

            // Third calculator inputs (from, to)
            fireEvent.change(inputs[4], { target: { value: "100" } });
            fireEvent.change(inputs[5], { target: { value: "150" } });

            expect(screen.getByText("50.00%")).toBeInTheDocument();
        });

        it("calculates decrease from 100 to 90 = -10%", () => {
            render(<PercentageCalculator />);
            const inputs = screen.getAllByRole("spinbutton");

            fireEvent.change(inputs[4], { target: { value: "100" } });
            fireEvent.change(inputs[5], { target: { value: "90" } });

            expect(screen.getByText("-10.00%")).toBeInTheDocument();
        });
    });

    describe("UI Labels", () => {
        it("shows What is label", () => {
            render(<PercentageCalculator />);
            expect(screen.getByText("What is")).toBeInTheDocument();
        });

        it("shows % of label", () => {
            render(<PercentageCalculator />);
            expect(screen.getByText("% of")).toBeInTheDocument();
        });

        it("shows From label", () => {
            render(<PercentageCalculator />);
            expect(screen.getByText("From")).toBeInTheDocument();
        });

        it("shows to label", () => {
            render(<PercentageCalculator />);
            expect(screen.getByText("to")).toBeInTheDocument();
        });
    });
});
