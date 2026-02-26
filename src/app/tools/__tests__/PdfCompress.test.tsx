"use client";
import { render, screen } from "@testing-library/react";
jest.mock("next/link", () => ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>);
import PDFCompress from "../pdf-compress/page";
describe("PDF Compress", () => {
    it("renders", () => { render(<PDFCompress />); expect(screen.getByText(/PDF Compress/i)).toBeInTheDocument(); });
    it("shows Back link", () => { render(<PDFCompress />); expect(screen.getByText(/Back/)).toBeInTheDocument(); });
});
