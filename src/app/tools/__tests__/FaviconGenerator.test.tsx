"use client";
import { render, screen } from "@testing-library/react";
jest.mock("next/link", () => ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>);
import FaviconGenerator from "../favicon-generator/page";
describe("Favicon Generator", () => {
    it("renders", () => { render(<FaviconGenerator />); expect(screen.getByText(/Favicon Generator/)).toBeInTheDocument(); });
    it("shows Back link", () => { render(<FaviconGenerator />); expect(screen.getByText("← Back")).toBeInTheDocument(); });
});
