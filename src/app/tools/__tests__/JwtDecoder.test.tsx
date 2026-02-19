"use client";
import { render, screen } from "@testing-library/react";
jest.mock("next/link", () => ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>);
import JwtDecoder from "../jwt-decoder/page";
describe("JWT Decoder", () => {
    it("renders", () => { render(<JwtDecoder />); expect(screen.getByText("JWT Decoder")).toBeInTheDocument(); });
    it("shows Back link", () => { render(<JwtDecoder />); expect(screen.getByText("← Back")).toBeInTheDocument(); });
});
