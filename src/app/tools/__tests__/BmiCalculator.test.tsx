"use client";

import { render, screen, fireEvent } from "@testing-library/react";
import BMICalculator from "../bmi-calculator/page";

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

describe("BMI Calculator", () => {
    describe("Rendering", () => {
        it("renders with title", () => {
            render(<BMICalculator />);
            expect(screen.getByText("BMI Health Insight")).toBeInTheDocument();
        });

        it("shows metric toggle button", () => {
            render(<BMICalculator />);
            expect(screen.getByText(/Metric \(kg\/cm\)/)).toBeInTheDocument();
        });

        it("shows imperial toggle button", () => {
            render(<BMICalculator />);
            expect(screen.getByText(/Imperial \(lbs\/ft\)/)).toBeInTheDocument();
        });

        it("shows height label", () => {
            render(<BMICalculator />);
            expect(screen.getByText(/Height \(cm\)/)).toBeInTheDocument();
        });

        it("shows weight label", () => {
            render(<BMICalculator />);
            expect(screen.getByText(/Weight \(kg\)/)).toBeInTheDocument();
        });
    });

    describe("Default BMI Calculation", () => {
        it("calculates BMI with default values (170cm, 70kg)", () => {
            render(<BMICalculator />);
            // BMI = 70 / (1.70 * 1.70) = 24.22 ≈ 24.2
            expect(screen.getByText("24.2")).toBeInTheDocument();
        });

        it("shows Normal Weight for default BMI", () => {
            render(<BMICalculator />);
            expect(screen.getByText("Normal Weight")).toBeInTheDocument();
        });
    });

    describe("Results Display", () => {
        it("shows Target Healthy Range section", () => {
            render(<BMICalculator />);
            expect(screen.getByText("Target Healthy Range")).toBeInTheDocument();
        });

        it("shows Ayurvedic Insight section", () => {
            render(<BMICalculator />);
            expect(screen.getByText(/Ayurvedic Insight/)).toBeInTheDocument();
        });

        it("shows disclaimer", () => {
            render(<BMICalculator />);
            expect(screen.getByText(/BMI is a screening tool/i)).toBeInTheDocument();
        });
    });

    describe("Unit Switching", () => {
        it("switches to imperial when button clicked", () => {
            render(<BMICalculator />);
            fireEvent.click(screen.getByText(/Imperial \(lbs\/ft\)/));

            expect(screen.getByText(/Weight \(lbs\)/)).toBeInTheDocument();
        });
    });

    describe("Input Fields", () => {
        it("has number inputs for height and weight", () => {
            render(<BMICalculator />);
            const inputs = screen.getAllByRole("spinbutton");
            expect(inputs.length).toBeGreaterThanOrEqual(2);
        });

        it("updates BMI when weight changes", () => {
            render(<BMICalculator />);
            const inputs = screen.getAllByRole("spinbutton");
            // Weight is second input
            fireEvent.change(inputs[1], { target: { value: "90" } });

            // BMI = 90 / (1.7 * 1.7) = 31.14 - should show Obese
            expect(screen.getByText("Obese")).toBeInTheDocument();
        });
    });
});
