"use client";

import { render, screen, fireEvent } from "@testing-library/react";
import PasswordGenerator from "../password-generator/page";

// Mock Next.js Link component
jest.mock("next/link", () => {
    return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
        return <a href={href}>{children}</a>;
    };
});

// Mock crypto.getRandomValues
const mockGetRandomValues = jest.fn((array: Uint32Array) => {
    for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 0xFFFFFFFF);
    }
    return array;
});

Object.defineProperty(global, 'crypto', {
    value: {
        getRandomValues: mockGetRandomValues
    }
});

describe("Password Generator", () => {
    beforeEach(() => {
        mockGetRandomValues.mockClear();
    });

    describe("Rendering", () => {
        it("renders with title", () => {
            render(<PasswordGenerator />);
            expect(screen.getByText(/Password Generator/i)).toBeInTheDocument();
        });

        it("shows generate button", () => {
            render(<PasswordGenerator />);
            expect(screen.getByText(/Generate Password/i)).toBeInTheDocument();
        });

        it("shows length slider", () => {
            render(<PasswordGenerator />);
            expect(screen.getByText("Length")).toBeInTheDocument();
            expect(screen.getByRole("slider")).toBeInTheDocument();
        });

        it("shows character type options", () => {
            render(<PasswordGenerator />);
            expect(screen.getByText(/Uppercase \(A-Z\)/i)).toBeInTheDocument();
            expect(screen.getByText(/Lowercase \(a-z\)/i)).toBeInTheDocument();
            expect(screen.getByText(/Numbers \(0-9\)/i)).toBeInTheDocument();
            expect(screen.getByText(/Symbols/i)).toBeInTheDocument();
        });

        it("shows placeholder before generation", () => {
            render(<PasswordGenerator />);
            expect(screen.getByText("Click Generate")).toBeInTheDocument();
        });
    });

    describe("Password Generation", () => {
        it("generates password when button clicked", () => {
            render(<PasswordGenerator />);
            const generateBtn = screen.getByText(/Generate Password/i);

            fireEvent.click(generateBtn);

            // Should no longer show placeholder
            expect(screen.queryByText("Click Generate")).not.toBeInTheDocument();
            // Crypto should have been called
            expect(mockGetRandomValues).toHaveBeenCalled();
        });

        it("shows strength indicator after generation", () => {
            render(<PasswordGenerator />);
            const generateBtn = screen.getByText(/Generate Password/i);

            fireEvent.click(generateBtn);

            expect(screen.getByText("Password Strength")).toBeInTheDocument();
        });
    });

    describe("Copy Functionality", () => {
        it("shows copy button", () => {
            render(<PasswordGenerator />);
            expect(screen.getByText("Copy")).toBeInTheDocument();
        });

        it("calls clipboard on copy after generating", async () => {
            render(<PasswordGenerator />);

            fireEvent.click(screen.getByText(/Generate Password/i));
            fireEvent.click(screen.getByText("Copy"));

            expect(navigator.clipboard.writeText).toHaveBeenCalled();
        });
    });

    describe("Length Control", () => {
        it("shows current length value", () => {
            render(<PasswordGenerator />);
            expect(screen.getByText("16")).toBeInTheDocument(); // Default length
        });

        it("updates length when slider changes", () => {
            render(<PasswordGenerator />);
            const slider = screen.getByRole("slider");

            fireEvent.change(slider, { target: { value: "24" } });

            expect(screen.getByText("24")).toBeInTheDocument();
        });
    });

    describe("Character Type Toggles", () => {
        it("has all checkboxes checked by default", () => {
            render(<PasswordGenerator />);
            const checkboxes = screen.getAllByRole("checkbox");
            expect(checkboxes.length).toBe(4);
            checkboxes.forEach(cb => {
                expect(cb).toBeChecked();
            });
        });

        it("can toggle character types", () => {
            render(<PasswordGenerator />);
            const checkboxes = screen.getAllByRole("checkbox");

            fireEvent.click(checkboxes[0]); // Uncheck uppercase

            expect(checkboxes[0]).not.toBeChecked();
        });
    });

    describe("Security Tips", () => {
        it("shows Security Tips section", () => {
            render(<PasswordGenerator />);
            expect(screen.getByText("🔒 Security Tips")).toBeInTheDocument();
        });
    });
});
