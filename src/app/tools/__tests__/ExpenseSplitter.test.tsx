"use client";
import { render, screen } from "@testing-library/react";
jest.mock("next/link", () => ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>);
import ExpenseSplitter from "../expense-splitter/page";
describe("Expense Splitter", () => {
    it("renders", () => { render(<ExpenseSplitter />); expect(screen.getByText(/Expense Splitter/)).toBeInTheDocument(); });
    it("shows Back link", () => { render(<ExpenseSplitter />); expect(screen.getByText("← Back")).toBeInTheDocument(); });
});
