"use client";

import { render, screen, fireEvent } from "@testing-library/react";
import AgeCalculator from "../age-calculator/page";

// Mock Next.js Link component
jest.mock("next/link", () => {
    return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
        return <a href={href}>{children}</a>;
    };
});

describe("Age Calculator", () => {
    describe("Rendering", () => {
        it("renders with title", () => {
            render(<AgeCalculator />);
            expect(screen.getByText("🎂 Age Calculator")).toBeInTheDocument();
        });

        it("shows description", () => {
            render(<AgeCalculator />);
            expect(screen.getByText(/Calculate your exact age/i)).toBeInTheDocument();
        });

        it("shows Date of Birth label", () => {
            render(<AgeCalculator />);
            expect(screen.getByText("Date of Birth")).toBeInTheDocument();
        });

        it("shows Calculate Age As Of label", () => {
            render(<AgeCalculator />);
            expect(screen.getByText("Calculate Age As Of")).toBeInTheDocument();
        });

        it("shows VedaWell Tools in header", () => {
            render(<AgeCalculator />);
            expect(screen.getByText("VedaWell Tools")).toBeInTheDocument();
        });

        it("shows All Tools link", () => {
            render(<AgeCalculator />);
            expect(screen.getByText("← All Tools")).toBeInTheDocument();
        });
    });

    describe("Input Fields", () => {
        it("has two date inputs", () => {
            render(<AgeCalculator />);
            // Date inputs have type="date"
            const inputs = document.querySelectorAll('input[type="date"]');
            expect(inputs.length).toBe(2);
        });
    });

    describe("Calculation Results", () => {
        it("shows Your Age after entering birth date", () => {
            render(<AgeCalculator />);
            const birthInput = document.querySelector('input[type="date"]') as HTMLInputElement;

            // Set a birth date (10 years ago)
            const tenYearsAgo = new Date();
            tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
            fireEvent.change(birthInput, { target: { value: tenYearsAgo.toISOString().split("T")[0] } });

            expect(screen.getByText("Your Age")).toBeInTheDocument();
        });

        it("shows Total Days stat", () => {
            render(<AgeCalculator />);
            const birthInput = document.querySelector('input[type="date"]') as HTMLInputElement;

            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
            fireEvent.change(birthInput, { target: { value: oneYearAgo.toISOString().split("T")[0] } });

            expect(screen.getByText("Total Days")).toBeInTheDocument();
        });

        it("shows Total Weeks stat", () => {
            render(<AgeCalculator />);
            const birthInput = document.querySelector('input[type="date"]') as HTMLInputElement;

            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
            fireEvent.change(birthInput, { target: { value: oneYearAgo.toISOString().split("T")[0] } });

            expect(screen.getByText("Total Weeks")).toBeInTheDocument();
        });

        it("shows Total Months stat", () => {
            render(<AgeCalculator />);
            const birthInput = document.querySelector('input[type="date"]') as HTMLInputElement;

            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
            fireEvent.change(birthInput, { target: { value: oneYearAgo.toISOString().split("T")[0] } });

            expect(screen.getByText("Total Months")).toBeInTheDocument();
        });

        it("shows Next Birthday stat", () => {
            render(<AgeCalculator />);
            const birthInput = document.querySelector('input[type="date"]') as HTMLInputElement;

            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
            fireEvent.change(birthInput, { target: { value: oneYearAgo.toISOString().split("T")[0] } });

            expect(screen.getByText("Next Birthday")).toBeInTheDocument();
        });
    });

    describe("Fun Facts", () => {
        it("shows Fun Facts section after calculation", () => {
            render(<AgeCalculator />);
            const birthInput = document.querySelector('input[type="date"]') as HTMLInputElement;

            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
            fireEvent.change(birthInput, { target: { value: oneYearAgo.toISOString().split("T")[0] } });

            expect(screen.getByText("Fun Facts")).toBeInTheDocument();
        });

        it("shows Born on a day info", () => {
            render(<AgeCalculator />);
            const birthInput = document.querySelector('input[type="date"]') as HTMLInputElement;

            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
            fireEvent.change(birthInput, { target: { value: oneYearAgo.toISOString().split("T")[0] } });

            expect(screen.getByText("Born on a")).toBeInTheDocument();
        });

        it("shows Zodiac Sign info", () => {
            render(<AgeCalculator />);
            const birthInput = document.querySelector('input[type="date"]') as HTMLInputElement;

            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
            fireEvent.change(birthInput, { target: { value: oneYearAgo.toISOString().split("T")[0] } });

            expect(screen.getByText("Zodiac Sign")).toBeInTheDocument();
        });

        it("shows Total Hours Lived info", () => {
            render(<AgeCalculator />);
            const birthInput = document.querySelector('input[type="date"]') as HTMLInputElement;

            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
            fireEvent.change(birthInput, { target: { value: oneYearAgo.toISOString().split("T")[0] } });

            expect(screen.getByText("Total Hours Lived")).toBeInTheDocument();
        });
    });
});
