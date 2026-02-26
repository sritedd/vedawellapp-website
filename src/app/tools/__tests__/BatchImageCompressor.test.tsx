"use client";
import { render, screen } from "@testing-library/react";
jest.mock("next/link", () => ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>);
import BatchImageCompressor from "../batch-image-compressor/page";
describe("Batch Image Compressor", () => {
    it("renders", () => { render(<BatchImageCompressor />); expect(screen.getByText(/Batch Image Compressor/i)).toBeInTheDocument(); });
    it("shows Back link", () => { render(<BatchImageCompressor />); expect(screen.getByText(/Back/)).toBeInTheDocument(); });
});
