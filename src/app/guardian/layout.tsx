"use client";

import ErrorBoundary from "@/components/ErrorBoundary";
import { ToastProvider } from "@/components/guardian/Toast";
import PageViewTracker from "@/components/guardian/PageViewTracker";

export default function GuardianLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ErrorBoundary>
            <ToastProvider>
                <PageViewTracker />
                {children}
            </ToastProvider>
        </ErrorBoundary>
    );
}
