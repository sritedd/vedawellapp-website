"use client";
import { render, screen } from "@testing-library/react";
jest.mock("next/link", () => ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>);
import UnixTimestampConverter from "../unix-timestamp-converter/page";
describe("Unix Timestamp Converter", () => {
    it("renders", () => { render(<UnixTimestampConverter />); expect(screen.getByText("🕐 Unix Timestamp Converter")).toBeInTheDocument(); });
    it("shows Back link", () => { render(<UnixTimestampConverter />); expect(screen.getByText("← Back")).toBeInTheDocument(); });
});
