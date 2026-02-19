"use client";
import { render, screen } from "@testing-library/react";
jest.mock("next/link", () => ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>);
import ImageCropper from "../image-cropper/page";
describe("Image Cropper", () => {
    it("renders", () => { render(<ImageCropper />); expect(screen.getByText(/Crop/i)).toBeInTheDocument(); });
    it("shows Back link", () => { render(<ImageCropper />); expect(screen.getByText(/Back/)).toBeInTheDocument(); });
});
