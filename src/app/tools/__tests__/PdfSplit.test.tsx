"use client";
import { render, screen } from "@testing-library/react";
jest.mock("next/link", () => ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>);
import PDFSplit from "../pdf-split/page";
describe("PDF Split", () => {
    it("renders", () => { render(<PDFSplit />); expect(screen.getByText(/PDF Split/i)).toBeInTheDocument(); });
    it("shows Back link", () => { render(<PDFSplit />); expect(screen.getByText(/Back/)).toBeInTheDocument(); });
});
