"use client";
import { render, screen } from "@testing-library/react";
jest.mock("next/link", () => ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>);
import ImageCompressor from "../image-compressor/page";
describe("Image Compressor", () => {
    it("renders", () => { render(<ImageCompressor />); expect(screen.getByText(/Compress/i)).toBeInTheDocument(); });
    it("shows Back link", () => { render(<ImageCompressor />); expect(screen.getByText(/Back/)).toBeInTheDocument(); });
});
