"use client";
import { render, screen } from "@testing-library/react";

// Simple tests for tools - Batch 1
jest.mock("next/link", () => ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>);

import TextDiff from "../text-diff/page";
describe("Text Diff", () => {
    it("renders", () => { render(<TextDiff />); expect(screen.getByText(/Text Diff|Compare/i)).toBeInTheDocument(); });
    it("shows Back link", () => { render(<TextDiff />); expect(screen.getByText("← Back")).toBeInTheDocument(); });
});
