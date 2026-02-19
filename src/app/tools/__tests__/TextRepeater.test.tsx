"use client";
import { render, screen } from "@testing-library/react";

jest.mock("next/link", () => ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>);

import TextRepeater from "../text-repeater/page";
describe("Text Repeater", () => {
    it("renders", () => { render(<TextRepeater />); expect(screen.getByText(/Text Repeater/i)).toBeInTheDocument(); });
    it("shows Back link", () => { render(<TextRepeater />); expect(screen.getByText("← Back")).toBeInTheDocument(); });
});
