"use client";
import { render, screen } from "@testing-library/react";
jest.mock("next/link", () => ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>);
import CsvToJson from "../csv-to-json/page";
describe("CSV to JSON", () => {
    it("renders", () => { render(<CsvToJson />); expect(screen.getByText(/CSV to JSON/)).toBeInTheDocument(); });
    it("shows Back link", () => { render(<CsvToJson />); expect(screen.getByText("← Back")).toBeInTheDocument(); });
});
