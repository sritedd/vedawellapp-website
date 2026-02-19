"use client";
import { render, screen } from "@testing-library/react";
jest.mock("next/link", () => ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>);
import SpeedReader from "../speed-reader/page";
describe("Speed Reader", () => {
    it("renders", () => { render(<SpeedReader />); expect(screen.getByText("👁️ Speed Reader")).toBeInTheDocument(); });
    it("shows Back link", () => { render(<SpeedReader />); expect(screen.getByText("← Back")).toBeInTheDocument(); });
});
