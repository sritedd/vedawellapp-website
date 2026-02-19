"use client";
import { render, screen } from "@testing-library/react";
jest.mock("next/link", () => ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>);
import RobotsTxtGenerator from "../robots-txt-generator/page";
describe("Robots.txt Generator", () => {
    it("renders", () => { render(<RobotsTxtGenerator />); expect(screen.getByText("🤖 Robots.txt Generator")).toBeInTheDocument(); });
    it("shows Back link", () => { render(<RobotsTxtGenerator />); expect(screen.getByText("← Back")).toBeInTheDocument(); });
});
