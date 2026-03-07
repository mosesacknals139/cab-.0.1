"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import { MapPin, Navigation, Clock, CheckCircle2, XCircle, Loader2, ArrowLeft, Receipt } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { formatINR } from "@/lib/currency";

interface Ride {
    id: string;
    pickup_location: string;
    dropoff_location: string;
    fare: number;
    status: string;
    created_at: string;
    payment_status?: string;
}

const statusConfig = {
    completed: { label: "Completed", color: "text-green-600 bg-green-50 dark:bg-green-900/20", icon: CheckCircle2 },
    cancelled: { label: "Cancelled", color: "text-red-600 bg-red-50 dark:bg-red-900/20", icon: XCircle },
    requested: { label: "Requested", color: "text-blue-600 bg-blue-50 dark:bg-blue-900/20", icon: Clock },
    accepted: { label: "Accepted", color: "text-blue-600 bg-blue-50 dark:bg-blue-900/20", icon: Clock },
    ongoing: { label: "Ongoing", color: "text-orange-600 bg-orange-50 dark:bg-orange-900/20", icon: Clock },
};

export default function RideHistoryPage() {
    const { user, isLoaded } = useUser();
    const [rides, setRides] = useState<Ride[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalSpent, setTotalSpent] = useState(0);

    useEffect(() => {
        if (!isLoaded || !user) return;

        const fetchRides = async () => {
            const { data } = await supabase
                .from("rides")
                .select("*")
                .eq("rider_id", user.id)
                .order("created_at", { ascending: false });

            const rideList = data || [];
            setRides(rideList);
            setTotalSpent(
                rideList
                    .filter((r) => r.status === "completed")
                    .reduce((sum: number, r: Ride) => sum + (r.fare || 0), 0)
            );
            setLoading(false);
        };

        fetchRides();
    }, [isLoaded, user]);

    const formatDate = (iso: string) => {
        return new Intl.DateTimeFormat("en-IN", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
        }).format(new Date(iso));
    };

    if (!isLoaded) return null;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 transition-colors duration-300">
            {/* Header */}
            <header className="bg-white dark:bg-background border-b border-gray-100 dark:border-zinc-800 sticky top-0 z-50">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
                    <Link
                        href="/dashboard"
                        className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors dark:text-zinc-200"
                    >
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Ride History</h1>
                        <p className="text-xs text-gray-500 dark:text-zinc-400">{rides.length} trips total</p>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-8 space-y-8">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                        { label: "Total Trips", value: rides.length },
                        {
                            label: "Completed",
                            value: rides.filter((r) => r.status === "completed").length,
                        },
                        {
                            label: "Total Spent",
                            value: formatINR(totalSpent),
                        },
                    ].map((stat, i) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm text-center"
                        >
                            <p className="text-2xl font-black text-gray-900 dark:text-white">{stat.value}</p>
                            <p className="text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wide mt-1">
                                {stat.label}
                            </p>
                        </motion.div>
                    ))}
                </div>

                {/* Ride List */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="animate-spin text-blue-600" size={36} />
                    </div>
                ) : rides.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-white dark:bg-zinc-900 rounded-3xl p-16 border border-dashed border-gray-200 dark:border-zinc-800 text-center space-y-3"
                    >
                        <Receipt className="mx-auto text-gray-300 dark:text-zinc-700" size={48} />
                        <p className="font-bold text-gray-500 dark:text-zinc-400">No rides yet</p>
                        <p className="text-sm text-gray-400 dark:text-zinc-500">
                            Your ride history will appear here.
                        </p>
                        <Link
                            href="/dashboard"
                            className="inline-block mt-4 bg-black dark:bg-white text-white dark:text-black px-6 py-3 rounded-xl font-bold hover:bg-gray-800 dark:hover:bg-zinc-200 transition-colors"
                        >
                            Book a Ride
                        </Link>
                    </motion.div>
                ) : (
                    <div className="space-y-4">
                        <AnimatePresence>
                            {rides.map((ride, i) => {
                                const config =
                                    statusConfig[ride.status as keyof typeof statusConfig] ||
                                    statusConfig.requested;
                                const Icon = config.icon;

                                return (
                                    <motion.div
                                        key={ride.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm overflow-hidden hover:shadow-md dark:hover:shadow-zinc-900/50 transition-all"
                                    >
                                        <div className="p-6">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-grow space-y-3">
                                                    <div className="flex items-center gap-3">
                                                        <MapPin className="text-gray-400 shrink-0" size={16} />
                                                        <p className="text-sm text-gray-700 dark:text-zinc-300 font-medium truncate">
                                                            {ride.pickup_location}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <Navigation className="text-blue-500 shrink-0" size={16} />
                                                        <p className="text-sm text-gray-700 dark:text-zinc-300 font-medium truncate">
                                                            {ride.dropoff_location}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="text-right shrink-0 space-y-2">
                                                    <p className="text-xl font-black text-gray-900 dark:text-white">
                                                        {formatINR(ride.fare || 0)}
                                                    </p>
                                                    <span
                                                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${config.color}`}
                                                    >
                                                        <Icon size={12} />
                                                        {config.label}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="px-6 py-3 bg-gray-50 dark:bg-zinc-800/50 border-t border-gray-100 dark:border-zinc-800 flex items-center justify-between">
                                            <p className="text-xs text-gray-400 dark:text-zinc-500">{formatDate(ride.created_at)}</p>
                                            {ride.status === "completed" && (
                                                <div className="flex gap-4">
                                                    <Link
                                                        href={`/rides/${ride.id}/receipt`}
                                                        className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                                                    >
                                                        <Receipt size={12} /> Receipt
                                                    </Link>
                                                    <Link
                                                        href={`/rides/${ride.id}/rate`}
                                                        className="text-xs font-bold text-yellow-600 hover:underline flex items-center gap-1"
                                                    >
                                                        Rate Trip
                                                    </Link>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                )}
            </main>
        </div>
    );
}
