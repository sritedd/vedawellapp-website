"use client";
import { render, screen } from "@testing-library/react";
jest.mock("next/link", () => ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>);
import ParaphrasingTool from "../paraphrasing-tool/page";
describe("Paraphrasing Tool", () => {
    it("renders", () => { render(<ParaphrasingTool />); expect(screen.getByText(/🔄|Paraphrasing Tool/i)).toBeInTheDocument(); });
    it("shows Back link", () => { render(<ParaphrasingTool />); expect(screen.getByText(/Back/)).toBeInTheDocument(); });
});
