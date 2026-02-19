"use client";
import { render, screen } from "@testing-library/react";
jest.mock("next/link", () => ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>);
import PomodoroTimer from "../pomodoro-timer/page";
describe("Pomodoro Timer", () => {
    it("renders", () => { render(<PomodoroTimer />); expect(screen.getByText(/Pomodoro/i)).toBeInTheDocument(); });
    it("shows Back link", () => { render(<PomodoroTimer />); expect(screen.getByText(/Back/)).toBeInTheDocument(); });
});
