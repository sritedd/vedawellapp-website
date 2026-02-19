"use client";
import { render, screen } from "@testing-library/react";
jest.mock("next/link", () => ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>);
import CSSGridGenerator from "../css-grid-generator/page";
describe("CSS Grid Generator", () => {
    it("renders", () => { render(<CSSGridGenerator />); expect(screen.getByText(/CSS Grid Generator/)).toBeInTheDocument(); });
    it("shows Back link", () => { render(<CSSGridGenerator />); expect(screen.getByText("← Back")).toBeInTheDocument(); });
});
