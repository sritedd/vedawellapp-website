"use client";
import { render, screen } from "@testing-library/react";
jest.mock("next/link", () => ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>);
import SchemaMarkupGenerator from "../schema-markup-generator/page";
describe("Schema Markup Generator", () => {
    it("renders", () => { render(<SchemaMarkupGenerator />); expect(screen.getByText("📋 Schema Markup Generator")).toBeInTheDocument(); });
    it("shows Back link", () => { render(<SchemaMarkupGenerator />); expect(screen.getByText("← Back")).toBeInTheDocument(); });
});
