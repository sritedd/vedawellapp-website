import type { Metadata } from "next";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ToastProvider } from "@/components/guardian/Toast";
import PageViewTracker from "@/components/guardian/PageViewTracker";

// Server layout so the product can own its <title>. Without this every Guardian
// page inherited the root default — "VedaWell Tools - 90+ Free Online Tools,
// Games & HomeOwner Guardian" — in the browser tab of a homeowner's evidence
// record (guide/19 §2.1). The three providers below are client components and
// render unchanged.
export const metadata: Metadata = {
    title: {
        default: "HomeOwner Guardian",
        template: "%s · HomeOwner Guardian",
    },
};

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
