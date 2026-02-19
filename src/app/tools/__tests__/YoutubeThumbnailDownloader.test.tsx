"use client";
import { render, screen } from "@testing-library/react";
jest.mock("next/link", () => ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>);
import YoutubeThumbnailDownloader from "../youtube-thumbnail-downloader/page";
describe("Youtube Thumbnail Downloader", () => {
    it("renders", () => { render(<YoutubeThumbnailDownloader />); expect(screen.getByText("📺 YouTube Thumbnail Downloader")).toBeInTheDocument(); });
    it("shows Back link", () => { render(<YoutubeThumbnailDownloader />); expect(screen.getByText("← Back")).toBeInTheDocument(); });
});
