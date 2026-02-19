"use client";
import { render, screen } from "@testing-library/react";
jest.mock("next/link", () => ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>);
import BorderRadiusPreview from "../border-radius-preview/page";
describe("Border Radius Preview", () => {
    it("renders", () => { render(<BorderRadiusPreview />); expect(screen.getByText(/Border Radius Preview/)).toBeInTheDocument(); });
    it("shows Back link", () => { render(<BorderRadiusPreview />); expect(screen.getByText("← Back")).toBeInTheDocument(); });
});
