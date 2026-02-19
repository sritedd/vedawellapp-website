"use client";
import { render, screen } from "@testing-library/react";
jest.mock("next/link", () => ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>);
import ImageResizer from "../image-resizer/page";
describe("Image Resizer", () => {
    it("renders", () => { render(<ImageResizer />); expect(screen.getByText("📐 Image Resizer")).toBeInTheDocument(); });
    it("shows Back link", () => { render(<ImageResizer />); expect(screen.getByText("← Back")).toBeInTheDocument(); });
});
