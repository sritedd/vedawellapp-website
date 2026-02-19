"use client";
import { render, screen } from "@testing-library/react";
jest.mock("next/link", () => ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>);
import ImageWatermarker from "../image-watermarker/page";
describe("Image Watermarker", () => {
    it("renders", () => { render(<ImageWatermarker />); expect(screen.getByText(/Watermark/i)).toBeInTheDocument(); });
    it("shows Back link", () => { render(<ImageWatermarker />); expect(screen.getByText(/Back/)).toBeInTheDocument(); });
});
