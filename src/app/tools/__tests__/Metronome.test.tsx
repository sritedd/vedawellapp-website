"use client";
import { render, screen } from "@testing-library/react";
jest.mock("next/link", () => ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>);
import Metronome from "../metronome/page";
describe("Metronome", () => {
    it("renders", () => { render(<Metronome />); expect(screen.getByText(/Metronome/i)).toBeInTheDocument(); });
    it("shows Back link", () => { render(<Metronome />); expect(screen.getByText(/Back/)).toBeInTheDocument(); });
});
