"use client";
import { render, screen } from "@testing-library/react";
jest.mock("next/link", () => ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>);
import TypingSpeedTest from "../typing-speed-test/page";
describe("Typing Speed Test", () => {
    it("renders", () => { render(<TypingSpeedTest />); expect(screen.getByText(/Typing/i)).toBeInTheDocument(); });
    it("shows Back link", () => { render(<TypingSpeedTest />); expect(screen.getByText(/Back/)).toBeInTheDocument(); });
});
