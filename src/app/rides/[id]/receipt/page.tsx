"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import { Star, Download, ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { formatINR } from "@/lib/currency";
import { DemoRide, getDemoRideById } from "@/lib/demo-rides";
import { Database } from "@/types/database";

type RideRecord = Database["public"]["Tables"]["rides"]["Row"] | DemoRide;

export default function ReceiptPage() {
    const { user, isLoaded } = useUser();
    const params = useParams();
    const [ride, setRide] = useState<RideRecord | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isLoaded || !user || !params?.id) return;

        const fetchRide = async () => {
            const { data } = await supabase
                .from("rides")
                .select("*")
                .eq("id", params.id as string)
                .eq("rider_id", user.id)
                .single();

            if (data) {
                setRide(data);
            } else {
                const demoRide = getDemoRideById(params.id as string);
                setRide(demoRide?.rider_id === user.id ? demoRide : null);
            }
            setLoading(false);
        };
        fetchRide();
    }, [isLoaded, user, params?.id]);

    if (loading || !isLoaded) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!ride) {
        return (
            <div className="min-h-screen flex items-center justify-center flex-col gap-4">
                <p className="text-gray-500 font-medium">Receipt not found.</p>
                <Link href="/rides" className="text-blue-600 font-bold underline">Go back</Link>
            </div>
        );
    }

    const formatDate = (iso: string) =>
        new Intl.DateTimeFormat("en-IN", {
            weekday: "long", month: "long", day: "numeric", year: "numeric",
            hour: "numeric", minute: "2-digit",
        }).format(new Date(iso));

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-md mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <Link href="/rides" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ArrowLeft size={20} />
                    </Link>
                    <h1 className="text-xl font-bold">Trip Receipt</h1>
                </div>

                {/* Receipt card */}
                <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
                    {/* Header */}
                    <div className="bg-black text-white p-8 text-center space-y-2">
                        <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto">
                            <CheckCircle2 size={32} className="text-green-400" />
                        </div>
                        <h2 className="text-2xl font-black">Trip Completed</h2>
                        <p className="text-gray-400 text-sm">{formatDate(ride.created_at)}</p>
                    </div>

                    {/* Fare */}
                    <div className="p-8 text-center border-b border-gray-100">
                        <p className="text-5xl font-black text-gray-900">{formatINR(ride.fare || 0)}</p>
                        <p className="text-gray-400 text-sm mt-1">Total charged</p>
                    </div>

                    {/* Route */}
                    <div className="p-8 space-y-6">
                        <div className="flex gap-4">
                            <div className="flex flex-col items-center gap-1">
                                <div className="w-3 h-3 rounded-full bg-gray-900"></div>
                                <div className="w-0.5 h-12 bg-gray-200"></div>
                                <div className="w-3 h-3 bg-blue-600"></div>
                            </div>
                            <div className="flex flex-col justify-between text-sm py-0.5">
                                <div>
                                    <p className="text-gray-400 text-xs font-bold uppercase">Pickup</p>
                                    <p className="text-gray-900 font-medium">{ride.pickup_location}</p>
                                </div>
                                <div>
                                    <p className="text-gray-400 text-xs font-bold uppercase">Dropoff</p>
                                    <p className="text-gray-900 font-medium">{ride.dropoff_location}</p>
                                </div>
                            </div>
                        </div>

                        {/* Breakdown */}
                        <div className="bg-gray-50 rounded-2xl p-5 space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Base fare</span>
                                <span className="text-gray-900 font-medium">{formatINR((ride.fare || 0) * 0.7)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Service fee</span>
                                <span className="text-gray-900 font-medium">{formatINR((ride.fare || 0) * 0.2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Tax</span>
                                <span className="text-gray-900 font-medium">{formatINR((ride.fare || 0) * 0.1)}</span>
                            </div>
                            <div className="flex justify-between font-bold border-t border-gray-200 pt-3">
                                <span className="text-gray-900">Total</span>
                                <span className="text-gray-900">{formatINR(ride.fare || 0)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="px-8 pb-8 flex gap-3">
                        <Link
                            href={`/rides/${ride.id}/rate`}
                            className="flex-1 bg-black text-white py-4 rounded-2xl font-bold text-center flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors"
                        >
                            <Star size={18} /> Rate Driver
                        </Link>
                        <button className="p-4 border border-gray-200 rounded-2xl hover:bg-gray-50 transition-colors">
                            <Download size={20} className="text-gray-600" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
