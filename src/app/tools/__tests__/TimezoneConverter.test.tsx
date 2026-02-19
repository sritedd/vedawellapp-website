"use client";
import { render, screen } from "@testing-library/react";
jest.mock("next/link", () => ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>);
import TimezoneConverter from "../timezone-converter/page";
describe("Timezone Converter", () => {
    it("renders", () => { render(<TimezoneConverter />); expect(screen.getByText(/🌍|Time Zone|Convert/i)).toBeInTheDocument(); });
    it("shows Back link", () => { render(<TimezoneConverter />); expect(screen.getByText(/Back/)).toBeInTheDocument(); });
});
