"use client";
import { render, screen, fireEvent } from "@testing-library/react";
import LoremIpsumGenerator from "../lorem-ipsum-generator/page";

jest.mock("next/link", () => ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>);

describe("Lorem Ipsum Generator", () => {
    it("renders with title", () => { render(<LoremIpsumGenerator />); expect(screen.getByText("📝 Lorem Ipsum Generator")).toBeInTheDocument(); });
    it("shows Back link", () => { render(<LoremIpsumGenerator />); expect(screen.getByText("← Back")).toBeInTheDocument(); });
    it("shows Paragraphs option", () => { render(<LoremIpsumGenerator />); expect(screen.getByText("Paragraphs")).toBeInTheDocument(); });
    it("shows Sentences option", () => { render(<LoremIpsumGenerator />); expect(screen.getByText("Sentences")).toBeInTheDocument(); });
    it("shows Words option", () => { render(<LoremIpsumGenerator />); expect(screen.getByText("Words")).toBeInTheDocument(); });
    it("shows Copy Text button", () => { render(<LoremIpsumGenerator />); expect(screen.getByText("Copy Text")).toBeInTheDocument(); });
    it("generates Lorem ipsum text", () => { render(<LoremIpsumGenerator />); expect(screen.getByText(/Lorem ipsum/)).toBeInTheDocument(); });
    it("has count input", () => { render(<LoremIpsumGenerator />); expect(screen.getByRole("spinbutton")).toHaveValue(3); });
});
