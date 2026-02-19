"use client";
import { render, screen } from "@testing-library/react";
jest.mock("next/link", () => ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>);
import PlainTextPaster from "../plain-text-paster/page";
describe("Plain Text Paster", () => {
    it("renders", () => { render(<PlainTextPaster />); expect(screen.getByText("📋 Plain Text Paster")).toBeInTheDocument(); });
    it("shows Back link", () => { render(<PlainTextPaster />); expect(screen.getByText("← Back")).toBeInTheDocument(); });
});
