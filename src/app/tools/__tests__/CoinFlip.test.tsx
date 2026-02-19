"use client";

import { render, screen, fireEvent, act } from "@testing-library/react";
import CoinFlip from "../coin-flip/page";

// Mock Next.js Link component
jest.mock("next/link", () => {
    return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
        return <a href={href}>{children}</a>;
    };
});

describe("Coin Flip", () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe("Rendering", () => {
        it("renders with title", () => {
            render(<CoinFlip />);
            expect(screen.getByText("🪙 Coin Flip")).toBeInTheDocument();
        });

        it("shows Flip Coin button", () => {
            render(<CoinFlip />);
            expect(screen.getByText("Flip Coin")).toBeInTheDocument();
        });

        it("shows Ready state initially", () => {
            render(<CoinFlip />);
            expect(screen.getByText("Ready")).toBeInTheDocument();
        });

        it("shows coin emoji initially", () => {
            render(<CoinFlip />);
            expect(screen.getByText("🪙")).toBeInTheDocument();
        });

        it("shows Back link", () => {
            render(<CoinFlip />);
            expect(screen.getByText("← Back")).toBeInTheDocument();
        });
    });

    describe("Flip Action", () => {
        it("shows Flipping... during animation", () => {
            render(<CoinFlip />);
            fireEvent.click(screen.getByText("Flip Coin"));

            expect(screen.getByText("Flipping...")).toBeInTheDocument();
        });

        it("disables button during flip", () => {
            render(<CoinFlip />);
            fireEvent.click(screen.getByText("Flip Coin"));

            expect(screen.getByText("Flipping...")).toBeDisabled();
        });

        it("shows result after flip completes", async () => {
            render(<CoinFlip />);
            fireEvent.click(screen.getByText("Flip Coin"));

            // Fast-forward through all intervals
            act(() => {
                jest.advanceTimersByTime(1500);
            });

            // Flip Coin button should reappear after flip
            expect(screen.getByText("Flip Coin")).toBeInTheDocument();
        });

        it("shows heads emoji for heads result", async () => {
            // Mock Math.random to return 0 (heads)
            const mockRandom = jest.spyOn(Math, "random").mockReturnValue(0.1);

            render(<CoinFlip />);
            fireEvent.click(screen.getByText("Flip Coin"));

            act(() => {
                jest.advanceTimersByTime(1500);
            });

            expect(screen.getByText("👑")).toBeInTheDocument();
            mockRandom.mockRestore();
        });

        it("shows tails emoji for tails result", async () => {
            // Mock Math.random to return 0.9 (tails)
            const mockRandom = jest.spyOn(Math, "random").mockReturnValue(0.9);

            render(<CoinFlip />);
            fireEvent.click(screen.getByText("Flip Coin"));

            act(() => {
                jest.advanceTimersByTime(1500);
            });

            expect(screen.getByText("🦅")).toBeInTheDocument();
            mockRandom.mockRestore();
        });
    });

    describe("History", () => {
        it("shows history after first flip", async () => {
            render(<CoinFlip />);
            fireEvent.click(screen.getByText("Flip Coin"));

            act(() => {
                jest.advanceTimersByTime(1500);
            });

            expect(screen.getByText("Clear History")).toBeInTheDocument();
        });

        it("shows Clear History button after flip", async () => {
            render(<CoinFlip />);
            fireEvent.click(screen.getByText("Flip Coin"));

            act(() => {
                jest.advanceTimersByTime(1500);
            });

            expect(screen.getByText("Clear History")).toBeInTheDocument();
        });

        it("clears history when Clear History clicked", async () => {
            render(<CoinFlip />);
            fireEvent.click(screen.getByText("Flip Coin"));

            act(() => {
                jest.advanceTimersByTime(1500);
            });

            fireEvent.click(screen.getByText("Clear History"));

            expect(screen.queryByText("Clear History")).not.toBeInTheDocument();
        });
    });
});
