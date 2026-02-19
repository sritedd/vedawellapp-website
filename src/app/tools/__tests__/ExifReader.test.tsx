"use client";
import { render, screen } from "@testing-library/react";
import EXIFReader from "../exif-reader/page";

jest.mock("next/link", () => ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>);

describe("EXIF Reader", () => {
    it("renders", () => {
        render(<EXIFReader />);
        expect(screen.getByText(/EXIF Reader/)).toBeInTheDocument();
    });
    it("shows Back link", () => {
        render(<EXIFReader />);
        expect(screen.getByText("← Back")).toBeInTheDocument();
    });
});
