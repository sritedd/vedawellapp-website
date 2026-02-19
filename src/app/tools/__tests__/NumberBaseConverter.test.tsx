"use client";
import { render, screen } from "@testing-library/react";
jest.mock("next/link", () => ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>);
import NumberBaseConverter from "../number-base-converter/page";
describe("Number Base Converter", () => {
    it("renders", () => { render(<NumberBaseConverter />); expect(screen.getByText(/🔢|Number Base Converter/i)).toBeInTheDocument(); });
    it("shows Back link", () => { render(<NumberBaseConverter />); expect(screen.getByText(/Back/)).toBeInTheDocument(); });
});
