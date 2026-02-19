"use client";
import { render, screen } from "@testing-library/react";
jest.mock("next/link", () => ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>);
import CharacterCounter from "../character-counter/page";
describe("Character Counter", () => {
    it("renders", () => { render(<CharacterCounter />); expect(screen.getByText("📊 Character Counter")).toBeInTheDocument(); });
    it("shows Back link", () => { render(<CharacterCounter />); expect(screen.getByText("← Back")).toBeInTheDocument(); });
});
