"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "info";

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

// Global event emitter via custom events
export function showToast(message: string, type: ToastType = "info") {
    const event = new CustomEvent("show-toast", { detail: { message, type } });
    window.dispatchEvent(event);
}

export function ToastContainer() {
    const [toasts, setToasts] = useState<Toast[]>([]);

    useEffect(() => {
        const handler = (e: Event) => {
            const { message, type } = (e as CustomEvent).detail;
            const id = Math.random().toString(36).slice(2);
            setToasts((prev) => [...prev, { id, message, type }]);
            setTimeout(() => {
                setToasts((prev) => prev.filter((t) => t.id !== id));
            }, 4000);
        };

        window.addEventListener("show-toast", handler);
        return () => window.removeEventListener("show-toast", handler);
    }, []);

    const icons = {
        success: <CheckCircle2 className="text-green-400 shrink-0" size={20} />,
        error: <XCircle className="text-red-400 shrink-0" size={20} />,
        info: <Info className="text-blue-400 shrink-0" size={20} />,
    };

    return (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className="flex items-center gap-3 bg-gray-900 text-white px-5 py-4 rounded-2xl shadow-2xl shadow-black/40 pointer-events-auto min-w-[280px] max-w-sm animate-[slideUp_0.3s_ease]"
                >
                    {icons[toast.type]}
                    <p className="text-sm font-medium flex-grow">{toast.message}</p>
                    <button
                        onClick={() =>
                            setToasts((prev) => prev.filter((t) => t.id !== toast.id))
                        }
                        className="text-gray-500 hover:text-white transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>
            ))}
        </div>
    );
}
