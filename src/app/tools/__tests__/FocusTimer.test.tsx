"use client";
import { render, screen } from "@testing-library/react";
jest.mock("next/link", () => ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>);
import FocusTimer from "../focus-timer/page";
describe("Focus Timer", () => {
    it("renders", () => { render(<FocusTimer />); expect(screen.getAllByText(/Focus/)[0]).toBeInTheDocument(); });
    it("shows All Tools link", () => { render(<FocusTimer />); expect(screen.getByText("← All Tools")).toBeInTheDocument(); });
});
