"use client";
import { render, screen, fireEvent } from "@testing-library/react";
import URLEncoder from "../url-encoder/page";

jest.mock("next/link", () => ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>);

describe("URL Encoder", () => {
    it("renders with title", () => { render(<URLEncoder />); expect(screen.getByText("🔗 URL Encoder/Decoder")).toBeInTheDocument(); });
    it("shows Encode button", () => { render(<URLEncoder />); expect(screen.getByText("Encode")).toBeInTheDocument(); });
    it("shows Decode button", () => { render(<URLEncoder />); expect(screen.getByText("Decode")).toBeInTheDocument(); });
    it("shows Input label", () => { render(<URLEncoder />); expect(screen.getByText("Input")).toBeInTheDocument(); });
    it("shows Result label", () => { render(<URLEncoder />); expect(screen.getByText("Result")).toBeInTheDocument(); });
    it("shows Back link", () => { render(<URLEncoder />); expect(screen.getByText("← Back")).toBeInTheDocument(); });
    it("encodes input text", () => {
        render(<URLEncoder />);
        const input = screen.getByPlaceholderText("Enter text to encode...");
        fireEvent.change(input, { target: { value: "hello world" } });
        expect(screen.getByText("hello%20world")).toBeInTheDocument();
    });
    it("switches to decode mode", () => {
        render(<URLEncoder />);
        fireEvent.click(screen.getByText("Decode"));
        expect(screen.getByPlaceholderText("Enter URL encoded text...")).toBeInTheDocument();
    });
});
