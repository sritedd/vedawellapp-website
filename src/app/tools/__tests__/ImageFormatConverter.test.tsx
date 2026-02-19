"use client";
import { render, screen } from "@testing-library/react";
jest.mock("next/link", () => ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>);
import ImageFormatConverter from "../image-format-converter/page";
describe("Image Format Converter", () => {
    it("renders", () => { render(<ImageFormatConverter />); expect(screen.getByText(/Format|Convert/i)).toBeInTheDocument(); });
    it("shows Back link", () => { render(<ImageFormatConverter />); expect(screen.getByText(/Back/)).toBeInTheDocument(); });
});
