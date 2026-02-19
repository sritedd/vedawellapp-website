"use client";

import { render, screen, fireEvent, act } from "@testing-library/react";
import DiceRoller from "../dice-roller/page";

// Mock Next.js Link component
jest.mock("next/link", () => {
    return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
        return <a href={href}>{children}</a>;
    };
});

describe("Dice Roller", () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe("Rendering", () => {
        it("renders with title", () => {
            render(<DiceRoller />);
            expect(screen.getByText("🎲 Dice Roller")).toBeInTheDocument();
        });

        it("shows Roll Dice button", () => {
            render(<DiceRoller />);
            expect(screen.getByText("🎲 Roll Dice")).toBeInTheDocument();
        });

        it("shows initial state message", () => {
            render(<DiceRoller />);
            expect(screen.getByText("Click Roll to start")).toBeInTheDocument();
        });

        it("shows Back link", () => {
            render(<DiceRoller />);
            expect(screen.getByText("← Back")).toBeInTheDocument();
        });

        it("shows Number of Dice label", () => {
            render(<DiceRoller />);
            expect(screen.getByText("Number of Dice")).toBeInTheDocument();
        });

        it("shows Sides label", () => {
            render(<DiceRoller />);
            expect(screen.getByText("Sides")).toBeInTheDocument();
        });
    });

    describe("Configuration", () => {
        it("has dice count select with default of 2", () => {
            render(<DiceRoller />);
            const selects = screen.getAllByRole("combobox");
            expect(selects[0]).toHaveValue("2");
        });

        it("has sides select with default of 6", () => {
            render(<DiceRoller />);
            const selects = screen.getAllByRole("combobox");
            expect(selects[1]).toHaveValue("6");
        });

        it("can change dice count", () => {
            render(<DiceRoller />);
            const selects = screen.getAllByRole("combobox");
            fireEvent.change(selects[0], { target: { value: "4" } });
            expect(selects[0]).toHaveValue("4");
        });

        it("can change sides", () => {
            render(<DiceRoller />);
            const selects = screen.getAllByRole("combobox");
            fireEvent.change(selects[1], { target: { value: "20" } });
            expect(selects[1]).toHaveValue("20");
        });
    });

    describe("Rolling", () => {
        it("shows Rolling... during animation", () => {
            render(<DiceRoller />);
            fireEvent.click(screen.getByText("🎲 Roll Dice"));

            expect(screen.getByText("Rolling...")).toBeInTheDocument();
        });

        it("disables button during roll", () => {
            render(<DiceRoller />);
            fireEvent.click(screen.getByText("🎲 Roll Dice"));

            expect(screen.getByText("Rolling...")).toBeDisabled();
        });

        it("shows Total after roll completes", async () => {
            render(<DiceRoller />);
            fireEvent.click(screen.getByText("🎲 Roll Dice"));

            act(() => {
                jest.advanceTimersByTime(1500);
            });

            expect(screen.getByText(/Total:/)).toBeInTheDocument();
        });
    });

    describe("History", () => {
        it("shows History after first roll", async () => {
            render(<DiceRoller />);
            fireEvent.click(screen.getByText("🎲 Roll Dice"));

            act(() => {
                jest.advanceTimersByTime(1500);
            });

            expect(screen.getByText("History")).toBeInTheDocument();
        });
    });

    describe("Dice Types", () => {
        it("shows D4 option", () => {
            render(<DiceRoller />);
            expect(screen.getByText("D4")).toBeInTheDocument();
        });

        it("shows D6 option", () => {
            render(<DiceRoller />);
            expect(screen.getByText("D6")).toBeInTheDocument();
        });

        it("shows D20 option", () => {
            render(<DiceRoller />);
            expect(screen.getByText("D20")).toBeInTheDocument();
        });

        it("shows D100 option", () => {
            render(<DiceRoller />);
            expect(screen.getByText("D100")).toBeInTheDocument();
        });
    });
});
