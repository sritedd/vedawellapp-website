"use client";
import { render, screen } from "@testing-library/react";
jest.mock("next/link", () => ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>);
import PDFToImage from "../pdf-to-image/page";
describe("PDF To Image", () => {
    it("renders", () => { render(<PDFToImage />); expect(screen.getByText(/PDF to Image/i)).toBeInTheDocument(); });
    it("shows Back link", () => { render(<PDFToImage />); expect(screen.getByText(/Back/)).toBeInTheDocument(); });
});
