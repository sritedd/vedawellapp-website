"use client";
import { render, screen } from "@testing-library/react";
jest.mock("next/link", () => ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>);
import MeetingCostCalculator from "../meeting-cost-calculator/page";
describe("Meeting Cost Calculator", () => {
    it("renders", () => { render(<MeetingCostCalculator />); expect(screen.getByText(/Meeting/i)).toBeInTheDocument(); });
    it("shows Back link", () => { render(<MeetingCostCalculator />); expect(screen.getByText(/Back/)).toBeInTheDocument(); });
});
