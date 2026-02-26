"use client";
import { render, screen } from "@testing-library/react";
jest.mock("next/link", () => ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>);
import PDFMerge from "../pdf-merge/page";
describe("PDF Merge", () => {
    it("renders", () => { render(<PDFMerge />); expect(screen.getByText(/PDF Merge/i)).toBeInTheDocument(); });
    it("shows Back link", () => { render(<PDFMerge />); expect(screen.getByText(/Back/)).toBeInTheDocument(); });
});
