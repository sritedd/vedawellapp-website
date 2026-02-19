"use client";
import { render, screen, fireEvent } from "@testing-library/react";
import CountdownTimer from "../countdown-timer/page";

jest.mock("next/link", () => ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>);

describe("Countdown Timer", () => {
    it("renders with title", () => { render(<CountdownTimer />); expect(screen.getByText("⏱️ Countdown Timer")).toBeInTheDocument(); });
    it("shows Back link", () => { render(<CountdownTimer />); expect(screen.getByText("← Back")).toBeInTheDocument(); });
    it("shows event name input", () => { render(<CountdownTimer />); expect(screen.getByDisplayValue("My Event")).toBeInTheDocument(); });
    it("shows +1d quick button", () => { render(<CountdownTimer />); expect(screen.getByText("+1d")).toBeInTheDocument(); });
    it("shows +7d quick button", () => { render(<CountdownTimer />); expect(screen.getByText("+7d")).toBeInTheDocument(); });
    it("shows +30d quick button", () => { render(<CountdownTimer />); expect(screen.getByText("+30d")).toBeInTheDocument(); });
    it("shows +90d quick button", () => { render(<CountdownTimer />); expect(screen.getByText("+90d")).toBeInTheDocument(); });
    it("shows +365d quick button", () => { render(<CountdownTimer />); expect(screen.getByText("+365d")).toBeInTheDocument(); });
    it("shows countdown after setting date", () => {
        render(<CountdownTimer />);
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 10);
        const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
        fireEvent.change(dateInput, { target: { value: futureDate.toISOString().split("T")[0] } });
        expect(screen.getByText("Days")).toBeInTheDocument();
    });
});
