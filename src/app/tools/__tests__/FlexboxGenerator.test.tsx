"use client";
import { render, screen } from "@testing-library/react";
jest.mock("next/link", () => ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>);
import FlexboxGenerator from "../flexbox-generator/page";
describe("Flexbox Generator", () => {
    it("renders", () => { render(<FlexboxGenerator />); expect(screen.getByText(/Flexbox/i)).toBeInTheDocument(); });
    it("shows Back link", () => { render(<FlexboxGenerator />); expect(screen.getByText(/Back/)).toBeInTheDocument(); });
});
