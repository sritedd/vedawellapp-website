"use client";
import { render, screen } from "@testing-library/react";
jest.mock("next/link", () => ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>);
import ImageFilters from "../image-filters/page";
describe("Image Filters", () => {
    it("renders", () => { render(<ImageFilters />); expect(screen.getByText(/Image Filters/i)).toBeInTheDocument(); });
    it("shows Back link", () => { render(<ImageFilters />); expect(screen.getByText(/Back/)).toBeInTheDocument(); });
});
