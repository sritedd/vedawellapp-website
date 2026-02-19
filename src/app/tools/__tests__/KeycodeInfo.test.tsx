"use client";
import { render, screen } from "@testing-library/react";
jest.mock("next/link", () => ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>);
import KeycodeInfo from "../keycode-info/page";
describe("Keycode Info", () => {
    it("renders", () => { render(<KeycodeInfo />); expect(screen.getByText("⌨️ Keycode Info")).toBeInTheDocument(); });
    it("shows Back link", () => { render(<KeycodeInfo />); expect(screen.getByText("← Back")).toBeInTheDocument(); });
});
