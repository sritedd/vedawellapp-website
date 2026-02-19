"use client";
import { render, screen } from "@testing-library/react";
jest.mock("next/link", () => ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>);
import EmojiPicker from "../emoji-picker/page";
describe("Emoji Picker", () => {
    it("renders", () => { render(<EmojiPicker />); expect(screen.getByText(/Emoji/i)).toBeInTheDocument(); });
    it("shows Back link", () => { render(<EmojiPicker />); expect(screen.getByText(/Back/)).toBeInTheDocument(); });
});
