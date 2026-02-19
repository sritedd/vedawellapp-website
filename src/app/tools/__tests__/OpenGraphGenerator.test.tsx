"use client";
import { render, screen } from "@testing-library/react";
jest.mock("next/link", () => ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>);
import OpenGraphGenerator from "../open-graph-generator/page";
describe("Open Graph Generator", () => {
    it("renders", () => { render(<OpenGraphGenerator />); expect(screen.getByText(/📲|Open Graph Generator/i)).toBeInTheDocument(); });
    it("shows Back link", () => { render(<OpenGraphGenerator />); expect(screen.getByText(/Back/)).toBeInTheDocument(); });
});
