"use client";

import { useState, useEffect, useCallback, createContext, useContext } from "react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type ToastType = "success" | "error" | "info";

interface ToastMessage {
    id: number;
    text: string;
    type: ToastType;
}

interface ToastContextValue {
    toast: (text: string, type?: ToastType) => void;
}

/* ------------------------------------------------------------------ */
/*  Context                                                            */
/* ------------------------------------------------------------------ */

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function useToast() {
    return useContext(ToastContext);
}

/* ------------------------------------------------------------------ */
/*  Provider                                                           */
/* ------------------------------------------------------------------ */

let nextId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [messages, setMessages] = useState<ToastMessage[]>([]);

    const toast = useCallback((text: string, type: ToastType = "success") => {
        const id = ++nextId;
        setMessages((prev) => [...prev, { id, text, type }]);
    }, []);

    const dismiss = useCallback((id: number) => {
        setMessages((prev) => prev.filter((m) => m.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ toast }}>
            {children}
            {/* Toast container — fixed bottom-center, above mobile nav */}
            <div
                className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 pointer-events-none"
                aria-live="polite"
                role="status"
            >
                {messages.map((msg) => (
                    <ToastItem key={msg.id} message={msg} onDismiss={dismiss} />
                ))}
            </div>
        </ToastContext.Provider>
    );
}

/* ------------------------------------------------------------------ */
/*  Individual Toast                                                   */
/* ------------------------------------------------------------------ */

function ToastItem({ message, onDismiss }: { message: ToastMessage; onDismiss: (id: number) => void }) {
    useEffect(() => {
        const timer = setTimeout(() => onDismiss(message.id), 3000);
        return () => clearTimeout(timer);
    }, [message.id, onDismiss]);

    const bg =
        message.type === "success"
            ? "bg-green-600 text-white"
            : message.type === "error"
                ? "bg-red-600 text-white"
                : "bg-blue-600 text-white";

    const icon =
        message.type === "success"
            ? "\u2713"
            : message.type === "error"
                ? "\u2717"
                : "\u2139";

    return (
        <div
            className={`pointer-events-auto flex items-center gap-2 px-4 py-2.5 rounded-lg shadow-lg text-sm font-medium animate-in slide-in-from-bottom-4 fade-in duration-200 ${bg}`}
        >
            <span className="text-base">{icon}</span>
            <span>{message.text}</span>
            <button
                onClick={() => onDismiss(message.id)}
                className="ml-2 opacity-70 hover:opacity-100 text-base leading-none"
                aria-label="Dismiss"
            >
                &times;
            </button>
        </div>
    );
}
