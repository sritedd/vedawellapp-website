"use client";
import { render, screen, fireEvent } from "@testing-library/react";
import RegexTester from "../regex-tester/page";

jest.mock("next/link", () => ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>);

describe("Regex Tester", () => {
    it("renders with title", () => { render(<RegexTester />); expect(screen.getByText("Regex Tester")).toBeInTheDocument(); });
    it("shows Back link", () => { render(<RegexTester />); expect(screen.getByText("← Back")).toBeInTheDocument(); });
    it("shows Regular Expression label", () => { render(<RegexTester />); expect(screen.getByText("Regular Expression")).toBeInTheDocument(); });
    it("shows Test String label", () => { render(<RegexTester />); expect(screen.getByText("Test String")).toBeInTheDocument(); });
    it("shows Common Patterns section", () => { render(<RegexTester />); expect(screen.getByText("📚 Common Patterns")).toBeInTheDocument(); });
    it("shows Quick Reference section", () => { render(<RegexTester />); expect(screen.getByText("📖 Quick Reference")).toBeInTheDocument(); });
    it("shows Copy Pattern button", () => { render(<RegexTester />); expect(screen.getByText("Copy Pattern")).toBeInTheDocument(); });
    it("shows Email pattern", () => { render(<RegexTester />); expect(screen.getByText("Email")).toBeInTheDocument(); });
    it("shows URL pattern", () => { render(<RegexTester />); expect(screen.getByText("URL")).toBeInTheDocument(); });
    it("has flag buttons", () => { render(<RegexTester />); expect(screen.getByText("g")).toBeInTheDocument(); });
});
