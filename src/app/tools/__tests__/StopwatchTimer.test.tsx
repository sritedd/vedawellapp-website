"use client";

import { render, screen, fireEvent, act } from "@testing-library/react";
import StopwatchTimer from "../stopwatch-timer/page";

// Mock Next.js Link component
jest.mock("next/link", () => {
    return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
        return <a href={href}>{children}</a>;
    };
});

describe("Stopwatch Timer", () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe("Rendering", () => {
        it("renders with title", () => {
            render(<StopwatchTimer />);
            expect(screen.getByText("⏱️ Stopwatch")).toBeInTheDocument();
        });

        it("shows Back link", () => {
            render(<StopwatchTimer />);
            expect(screen.getByText("← Back")).toBeInTheDocument();
        });

        it("shows initial time of 00:00.00", () => {
            render(<StopwatchTimer />);
            expect(screen.getByText("00:00.00")).toBeInTheDocument();
        });

        it("shows Start button initially", () => {
            render(<StopwatchTimer />);
            expect(screen.getByText("Start")).toBeInTheDocument();
        });

        it("shows Lap button", () => {
            render(<StopwatchTimer />);
            expect(screen.getByText("Lap")).toBeInTheDocument();
        });

        it("shows Reset button", () => {
            render(<StopwatchTimer />);
            expect(screen.getByText("Reset")).toBeInTheDocument();
        });

        it("has Lap button disabled initially", () => {
            render(<StopwatchTimer />);
            expect(screen.getByText("Lap")).toBeDisabled();
        });
    });

    describe("Stopwatch Controls", () => {
        it("shows Stop button after starting", () => {
            render(<StopwatchTimer />);
            fireEvent.click(screen.getByText("Start"));

            expect(screen.getByText("Stop")).toBeInTheDocument();
        });

        it("enables Lap button after starting", () => {
            render(<StopwatchTimer />);
            fireEvent.click(screen.getByText("Start"));

            expect(screen.getByText("Lap")).not.toBeDisabled();
        });

        it("shows Start button after stopping", () => {
            render(<StopwatchTimer />);
            fireEvent.click(screen.getByText("Start"));
            fireEvent.click(screen.getByText("Stop"));

            expect(screen.getByText("Start")).toBeInTheDocument();
        });

        it("updates time when running", () => {
            render(<StopwatchTimer />);
            fireEvent.click(screen.getByText("Start"));

            act(() => {
                jest.advanceTimersByTime(1000);
            });

            // Time should have increased
            expect(screen.queryByText("00:00.00")).not.toBeInTheDocument();
        });

        it("resets time to 00:00.00", () => {
            render(<StopwatchTimer />);
            fireEvent.click(screen.getByText("Start"));

            act(() => {
                jest.advanceTimersByTime(1000);
            });

            fireEvent.click(screen.getByText("Reset"));

            expect(screen.getByText("00:00.00")).toBeInTheDocument();
        });
    });

    describe("Laps", () => {
        it("shows Laps section after recording a lap", () => {
            render(<StopwatchTimer />);
            fireEvent.click(screen.getByText("Start"));

            act(() => {
                jest.advanceTimersByTime(1000);
            });

            fireEvent.click(screen.getByText("Lap"));

            expect(screen.getByText("Laps")).toBeInTheDocument();
        });

        it("shows lap number", () => {
            render(<StopwatchTimer />);
            fireEvent.click(screen.getByText("Start"));

            act(() => {
                jest.advanceTimersByTime(1000);
            });

            fireEvent.click(screen.getByText("Lap"));

            expect(screen.getByText("Lap 1")).toBeInTheDocument();
        });

        it("clears laps on reset", () => {
            render(<StopwatchTimer />);
            fireEvent.click(screen.getByText("Start"));

            act(() => {
                jest.advanceTimersByTime(1000);
            });

            fireEvent.click(screen.getByText("Lap"));
            fireEvent.click(screen.getByText("Reset"));

            expect(screen.queryByText("Laps")).not.toBeInTheDocument();
        });
    });
});
