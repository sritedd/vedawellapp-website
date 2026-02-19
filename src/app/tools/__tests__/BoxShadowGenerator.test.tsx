"use client";
import { render, screen } from "@testing-library/react";
jest.mock("next/link", () => ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>);
import BoxShadowGenerator from "../box-shadow-generator/page";
describe("Box Shadow Generator", () => {
    it("renders", () => { render(<BoxShadowGenerator />); expect(screen.getByText("Box Shadow Generator")).toBeInTheDocument(); });
    it("shows Back link", () => { render(<BoxShadowGenerator />); expect(screen.getByText("← Back")).toBeInTheDocument(); });
});
