"use client";
import { render, screen } from "@testing-library/react";
jest.mock("next/link", () => ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>);
import NotesApp from "../notes-app/page";
describe("Notes App", () => {
    it("renders", () => { render(<NotesApp />); expect(screen.getByText("Select or create a note")).toBeInTheDocument(); });
    it("shows Back link", () => { render(<NotesApp />); expect(screen.getByText("← Back")).toBeInTheDocument(); });
});
