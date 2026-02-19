"use client";
import { render, screen } from "@testing-library/react";
import ColorPickerFromImage from "../color-picker-from-image/page";

jest.mock("next/link", () => ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>);

describe("Color Picker from Image", () => {
    it("renders", () => {
        render(<ColorPickerFromImage />);
        expect(screen.getByText(/Color Picker from Image/)).toBeInTheDocument();
    });
    it("shows Back link", () => {
        render(<ColorPickerFromImage />);
        expect(screen.getByText("← Back")).toBeInTheDocument();
    });
});
