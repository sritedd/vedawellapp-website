"use client";
import { render, screen } from "@testing-library/react";
jest.mock("next/link", () => ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>);
import FlashcardApp from "../flashcard-app/page";
describe("Flashcard App", () => {
    it("renders", () => { render(<FlashcardApp />); expect(screen.getByText(/Flashcard/i)).toBeInTheDocument(); });
    it("shows Back link", () => { render(<FlashcardApp />); expect(screen.getByText(/Back/)).toBeInTheDocument(); });
});
