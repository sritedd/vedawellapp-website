"use client";
import { render, screen } from "@testing-library/react";
import ScreenRecorder from "../screen-recorder/page";

jest.mock("next/link", () => ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>);

// Mock MediaRecorder
Object.defineProperty(window, 'MediaRecorder', {
    writable: true,
    value: jest.fn().mockImplementation(() => ({
        start: jest.fn(),
        stop: jest.fn(),
        pause: jest.fn(),
        resume: jest.fn(),
        state: "inactive",
        ondataavailable: jest.fn(),
        onstop: jest.fn(),
    })),
});
// Mock MediaDevices
Object.defineProperty(window.navigator, 'mediaDevices', {
    value: {
        getDisplayMedia: jest.fn().mockResolvedValue({
            getTracks: () => [{ stop: jest.fn() }],
            getVideoTracks: () => [{ onended: null, stop: jest.fn() }],
            getAudioTracks: () => [],
        }),
        getUserMedia: jest.fn().mockResolvedValue({
            getTracks: () => [{ stop: jest.fn() }],
        })
    },
});


describe("Screen Recorder", () => {
    it("renders", () => {
        render(<ScreenRecorder />);
        expect(screen.getByText(/Screen Recorder/)).toBeInTheDocument();
    });
    it("shows Back link", () => {
        render(<ScreenRecorder />);
        expect(screen.getByText("← Back")).toBeInTheDocument();
    });
});
