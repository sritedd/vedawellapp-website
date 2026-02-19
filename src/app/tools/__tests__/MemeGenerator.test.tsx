"use client";
import { render, screen } from "@testing-library/react";
jest.mock("next/link", () => ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>);
import MemeGenerator from "../meme-generator/page";
describe("Meme Generator", () => {
    it("renders", () => { render(<MemeGenerator />); expect(screen.getByText("😂 Meme Generator")).toBeInTheDocument(); });
    it("shows Back link", () => { render(<MemeGenerator />); expect(screen.getByText("← Back")).toBeInTheDocument(); });
});
