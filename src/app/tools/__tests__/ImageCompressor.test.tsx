"use client";
import { render, screen } from "@testing-library/react";
jest.mock("next/link", () => ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>);
import ImageCompressor from "../image-compressor/page";
describe("Image Compressor", () => {
    it("renders", () => {
        render(<ImageCompressor />);
        // The page contains multiple "Compress" matches (heading + button).
        // Use getAllByText to assert at least one is present without coupling
        // the test to the exact element.
        expect(screen.getAllByText(/Compress/i).length).toBeGreaterThan(0);
    });
    it("shows Back link", () => {
        render(<ImageCompressor />);
        expect(screen.getByText(/Back/)).toBeInTheDocument();
    });
});
