"use client";
import { render, screen } from "@testing-library/react";
jest.mock("next/link", () => ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>);
import RandomGenerator from "../random-generator/page";
describe("Random Generator", () => {
    it("renders", () => { render(<RandomGenerator />); expect(screen.getByText(/Random/i)).toBeInTheDocument(); });
    it("shows Back link", () => { render(<RandomGenerator />); expect(screen.getByText(/Back/)).toBeInTheDocument(); });
});
