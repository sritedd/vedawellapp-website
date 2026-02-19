"use client";
import { render, screen } from "@testing-library/react";
jest.mock("next/link", () => ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>);
import InvoiceGenerator from "../invoice-generator/page";
describe("Invoice Generator", () => {
    it("renders", () => { render(<InvoiceGenerator />); expect(screen.getByText(/Invoice Generator Pro/)).toBeInTheDocument(); });
    it("shows Back link", () => { render(<InvoiceGenerator />); expect(screen.getByText(/Back to Tools/)).toBeInTheDocument(); });
});
