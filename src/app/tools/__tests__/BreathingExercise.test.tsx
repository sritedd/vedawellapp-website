"use client";
import { render, screen } from "@testing-library/react";
jest.mock("next/link", () => ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>);
import BreathingExercise from "../breathing-exercise/page";
describe("Breathing Exercise", () => {
    it("renders", () => { render(<BreathingExercise />); expect(screen.getByText("🧘 Breathing Exercise")).toBeInTheDocument(); });
    it("shows Back link", () => { render(<BreathingExercise />); expect(screen.getByText("← Back")).toBeInTheDocument(); });
});
