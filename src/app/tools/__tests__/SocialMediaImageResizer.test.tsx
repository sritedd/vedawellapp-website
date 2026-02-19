"use client";
import { render, screen } from "@testing-library/react";
jest.mock("next/link", () => ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>);
import SocialMediaImageResizer from "../social-media-image-resizer/page";
describe("Social Media Image Resizer", () => {
    it("renders", () => { render(<SocialMediaImageResizer />); expect(screen.getByText("📱 Social Media Image Resizer")).toBeInTheDocument(); });
    it("shows Back link", () => { render(<SocialMediaImageResizer />); expect(screen.getByText("← Back")).toBeInTheDocument(); });
});
