"use client";
import { render, screen } from "@testing-library/react";
import DrawingCanvas from "../drawing-canvas/page";

jest.mock("next/link", () => ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>);

describe("Drawing Canvas", () => {
    it("renders", () => {
        render(<DrawingCanvas />);
        expect(screen.getByText(/Drawing Canvas/)).toBeInTheDocument();
    });
    it("shows Back link", () => {
        render(<DrawingCanvas />);
        expect(screen.getByText("← Back")).toBeInTheDocument();
    });
});
