"use client";
import { render, screen } from "@testing-library/react";

jest.mock("next/link", () => ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>);

import StringEncoder from "../string-encoder/page";
describe("String Encoder", () => {
    it("renders", () => { render(<StringEncoder />); expect(screen.getByText(/String Encoder/i)).toBeInTheDocument(); });
    it("shows Back link", () => { render(<StringEncoder />); expect(screen.getByText("← Back")).toBeInTheDocument(); });
});
