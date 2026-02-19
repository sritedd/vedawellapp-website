"use client";
import { render, screen } from "@testing-library/react";
import TextToSpeech from "../text-to-speech/page";

jest.mock("next/link", () => ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>);

// Mock SpeechSynthesis
Object.defineProperty(window, 'speechSynthesis', {
    value: {
        getVoices: jest.fn().mockReturnValue([]),
        speak: jest.fn(),
        cancel: jest.fn(),
        pause: jest.fn(),
        resume: jest.fn(),
        onvoiceschanged: null,
    },
});
Object.defineProperty(window, 'SpeechSynthesisUtterance', {
    value: jest.fn(),
});


describe("Text to Speech", () => {
    it("renders", () => {
        render(<TextToSpeech />);
        expect(screen.getByText(/Text to Speech/)).toBeInTheDocument();
    });
    it("shows Back link", () => {
        render(<TextToSpeech />);
        expect(screen.getByText("← Back")).toBeInTheDocument();
    });
});
