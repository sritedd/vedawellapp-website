"use client";
import { render, screen } from "@testing-library/react";
jest.mock("next/link", () => ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>);
import HabitTracker from "../habit-tracker/page";
describe("Habit Tracker", () => {
    it("renders", () => { render(<HabitTracker />); expect(screen.getByText(/📅|Add|Streak/i)).toBeInTheDocument(); });
    it("shows Back link", () => { render(<HabitTracker />); expect(screen.getByText(/Back/)).toBeInTheDocument(); });
});
