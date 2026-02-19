"use client";
import { render, screen } from "@testing-library/react";
jest.mock("next/link", () => ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>);
import QrCodeGenerator from "../qr-code-generator/page";
describe("QR Code Generator", () => {
    it("renders", () => { render(<QrCodeGenerator />); expect(screen.getByText("VedaWell Tools")).toBeInTheDocument(); });
    it("shows All Tools link", () => { render(<QrCodeGenerator />); expect(screen.getByText("← All Tools")).toBeInTheDocument(); });
});
