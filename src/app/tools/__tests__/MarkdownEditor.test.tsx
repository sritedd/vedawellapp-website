"use client";
import { render, screen } from "@testing-library/react";
jest.mock("next/link", () => ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>);
import MarkdownEditor from "../markdown-editor/page";
describe("Markdown Editor", () => {
    it("renders", () => { render(<MarkdownEditor />); expect(screen.getByText("Markdown Editor")).toBeInTheDocument(); });
    it("shows Back link", () => { render(<MarkdownEditor />); expect(screen.getByText("← Back")).toBeInTheDocument(); });
});
