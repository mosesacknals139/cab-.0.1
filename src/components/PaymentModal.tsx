"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Lock, Loader2, ShieldCheck } from "lucide-react";
import { showToast } from "@/components/Toast";
import { formatINR } from "@/lib/currency";

interface PaymentModalProps {
    rideId: string;
    fare: number;
    onClose: () => void;
    onSuccess: () => void;
}

interface RazorpayOrderData {
    id: string;
    amount: number;
    currency: string;
}

interface RazorpayPaymentResponse {
    razorpay_payment_id?: string;
    razorpay_order_id?: string;
    razorpay_signature?: string;
}

interface RazorpayFailureResponse {
    error?: {
        description?: string;
    };
}

interface RazorpayInstance {
    open: () => void;
    on: (event: "payment.failed", handler: (response: RazorpayFailureResponse) => void) => void;
}

interface RazorpayConstructor {
    new (options: Record<string, unknown>): RazorpayInstance;
}

declare global {
    interface Window {
        Razorpay: RazorpayConstructor;
    }
}

export default function PaymentModal({
    rideId,
    fare,
    onClose,
    onSuccess,
}: PaymentModalProps) {
    const [loading, setLoading] = useState(true);
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    const [orderData, setOrderData] = useState<RazorpayOrderData | null>(null);

    useEffect(() => {
        // Load Razorpay script
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        document.body.appendChild(script);

        // Fetch order data from our backend
        fetch("/api/payment/create-order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ rideId }),
        })
            .then(async (response) => {
                const contentType = response.headers.get("content-type") || "";
                const payload = contentType.includes("application/json")
                    ? await response.json()
                    : { error: await response.text() };

                if (!response.ok) {
                    throw new Error(payload.error || "Failed to initialize payment");
                }

                return payload;
            })
            .then((data) => {
                setOrderData(data);
                setLoading(false);
            })
            .catch((error: unknown) => {
                const message = error instanceof Error ? error.message : "Failed to initialize payment";
                showToast(message, "error");
                onClose();
            });

        return () => {
            if (document.body.contains(script)) {
                document.body.removeChild(script);
            }
        };
    }, [fare, rideId, onClose]);

    const handlePayment = () => {
        if (!orderData || !window.Razorpay || isProcessingPayment) return;

        const options = {
            key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
            amount: orderData.amount,
            currency: orderData.currency,
            name: "Uber Clone",
            description: `Payment for Ride #${rideId}`,
            order_id: orderData.id,
            handler: async function (response: RazorpayPaymentResponse) {
                setIsProcessingPayment(true);

                try {
                    const confirmResponse = await fetch("/api/payment/confirm", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            rideId,
                            paymentId: response.razorpay_payment_id,
                            orderId: response.razorpay_order_id,
                            signature: response.razorpay_signature,
                        }),
                    });

                    const confirmPayload = await confirmResponse.json();
                    if (!confirmResponse.ok) {
                        throw new Error(confirmPayload.error || "Payment confirmation failed.");
                    }

                    showToast("Payment successful! 🎉", "success");
                    onSuccess();
                } catch (error) {
                    const message = error instanceof Error ? error.message : "Payment confirmation failed.";
                    showToast(message, "error");
                } finally {
                    setIsProcessingPayment(false);
                }
            },
            prefill: {
                name: "User",
                email: "user@example.com",
            },
            theme: {
                color: "#2563eb",
            },
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (response: RazorpayFailureResponse) {
            showToast(response.error?.description || "Payment failed", "error");
        });
        rzp.open();
    };

    if (typeof document === "undefined") {
        return null;
    }

    return createPortal(
        <div className="fixed inset-0 z-[2000] flex items-end md:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-md bg-white dark:bg-zinc-950 rounded-t-3xl md:rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-zinc-800 transition-colors duration-300">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-zinc-900">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Complete Payment</h2>
                        <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
                            {formatINR(fare)}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isProcessingPayment}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors dark:text-zinc-400"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-8 space-y-6">
                    <div className="flex flex-col items-center text-center space-y-4">
                        <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400">
                            <ShieldCheck size={36} />
                        </div>
                        <div className="space-y-1">
                            <h3 className="font-bold text-gray-900 dark:text-white">Secure Checkout</h3>
                            <p className="text-sm text-gray-500 dark:text-zinc-400">Your payment is encrypted and secured by Razorpay.</p>
                        </div>
                    </div>

                    <button
                        onClick={handlePayment}
                        disabled={loading || isProcessingPayment}
                        className="w-full bg-black dark:bg-white text-white dark:text-black py-5 rounded-2xl font-bold text-lg hover:bg-gray-800 dark:hover:bg-zinc-200 transition-all shadow-xl shadow-gray-200 dark:shadow-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 active:scale-95"
                    >
                        {loading || isProcessingPayment ? (
                            <Loader2 className="animate-spin" size={20} />
                        ) : (
                            <Lock size={18} />
                        )}
                        {loading ? "Initializing..." : isProcessingPayment ? "Verifying Payment..." : "Pay with Razorpay"}
                    </button>

                    <p className="text-center text-[10px] uppercase tracking-widest font-black text-gray-300 dark:text-zinc-700 flex items-center justify-center gap-2">
                        <span className="h-px w-8 bg-gray-100 dark:bg-zinc-900"></span>
                        RAZORPAY SECURE
                        <span className="h-px w-8 bg-gray-100 dark:bg-zinc-900"></span>
                    </p>
                </div>
            </div>
        </div>,
        document.body
    );
}
