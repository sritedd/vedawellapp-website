"use client";
import { render, screen } from "@testing-library/react";
jest.mock("next/link", () => ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>);
import TodoList from "../todo-list/page";
describe("Todo List", () => {
    it("renders", () => { render(<TodoList />); expect(screen.getByText("✅ Todo List")).toBeInTheDocument(); });
    it("shows All Tools link", () => { render(<TodoList />); expect(screen.getByText("← All Tools")).toBeInTheDocument(); });
});
