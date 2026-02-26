"use client";
import { render, screen } from "@testing-library/react";
jest.mock("next/link", () => ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>);
import ImageToPDF from "../image-to-pdf/page";
describe("Image To PDF", () => {
    it("renders", () => { render(<ImageToPDF />); expect(screen.getByText(/Image to PDF/i)).toBeInTheDocument(); });
    it("shows Back link", () => { render(<ImageToPDF />); expect(screen.getByText(/Back/)).toBeInTheDocument(); });
});
