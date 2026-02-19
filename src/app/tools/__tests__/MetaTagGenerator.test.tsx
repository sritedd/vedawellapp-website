"use client";
import { render, screen } from "@testing-library/react";
jest.mock("next/link", () => ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>);
import MetaTagGenerator from "../meta-tag-generator/page";
describe("Meta Tag Generator", () => {
    it("renders", () => { render(<MetaTagGenerator />); expect(screen.getByText("🏷️ Meta Tag Generator")).toBeInTheDocument(); });
    it("shows Back link", () => { render(<MetaTagGenerator />); expect(screen.getByText("← Back")).toBeInTheDocument(); });
});
