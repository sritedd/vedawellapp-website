"use client";
import { render, screen } from "@testing-library/react";

jest.mock("next/link", () => ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>);

import WhitespaceRemover from "../whitespace-remover/page";
describe("Whitespace Remover", () => {
    it("renders", () => { render(<WhitespaceRemover />); expect(screen.getByText(/Whitespace Remover/i)).toBeInTheDocument(); });
    it("shows Back link", () => { render(<WhitespaceRemover />); expect(screen.getByText("← Back")).toBeInTheDocument(); });
});
