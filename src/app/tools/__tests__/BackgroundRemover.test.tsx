"use client";
import { render, screen } from "@testing-library/react";
import BackgroundRemover from "../background-remover/page";

jest.mock("next/link", () => ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>);

describe("Background Remover", () => {
    it("renders", () => {
        render(<BackgroundRemover />);
        expect(screen.getByText(/Background Remover/)).toBeInTheDocument();
    });
    it("shows Back link", () => {
        render(<BackgroundRemover />);
        expect(screen.getByText("← Back")).toBeInTheDocument();
    });
});
