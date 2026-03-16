"use client";

import ErrorBoundary from "@/components/ErrorBoundary";
import { ToastProvider } from "@/components/guardian/Toast";

export default function GuardianLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ErrorBoundary>
            <ToastProvider>{children}</ToastProvider>
        </ErrorBoundary>
    );
}
