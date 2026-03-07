"use client";

import { useUser, UserButton } from "@clerk/nextjs";
import { useCallback, useEffect, useRef, useState } from "react";
import { showToast } from "@/components/Toast";
import type { Database } from "@/types/database";
import { Car, MapPin, Navigation, Clock, CheckCircle2, Loader2, Play, RefreshCw } from "lucide-react";
import Link from "next/link";
import { formatINR } from "@/lib/currency";

type Ride = Database["public"]["Tables"]["rides"]["Row"];
type EarningRide = {
    id: string;
    fare: number | null;
    payment_status: "pending" | "paid" | "refunded" | null;
    created_at: string;
    pickup_location: string;
    dropoff_location: string;
};

type DriverStats = {
    completedTrips: number;
    acceptanceRate: number;
    todayEarnings: number;
    todayPendingPayout: number;
};

const DEFAULT_STATS: DriverStats = {
    completedTrips: 0,
    acceptanceRate: 0,
    todayEarnings: 0,
    todayPendingPayout: 0,
};

export default function DriverDashboard() {
    const { user, isLoaded } = useUser();
    const [activeTab, setActiveTab] = useState<"opportunities" | "earnings">("opportunities");
    const [requests, setRequests] = useState<Ride[]>([]);
    const [activeRide, setActiveRide] = useState<Ride | null>(null);
    const [recentEarnings, setRecentEarnings] = useState<EarningRide[]>([]);
    const [stats, setStats] = useState<DriverStats>(DEFAULT_STATS);
    const [setupMessage, setSetupMessage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [updatingRideId, setUpdatingRideId] = useState<string | null>(null);
    const [isStartingRide, setIsStartingRide] = useState(false);
    const [isCompletingRide, setIsCompletingRide] = useState(false);
    const [isOnline, setIsOnline] = useState(true);
    const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
    const previousRequestCountRef = useRef(0);
    const onlineStateInitializedRef = useRef(false);

    const loadDriverState = useCallback(async (silent = false) => {
        if (!silent) {
            setIsLoading(true);
        }

        try {
            const response = await fetch("/api/driver/rides", {
                cache: "no-store",
            });
            const payload = await response.json();

            if (!response.ok) {
                throw new Error(payload.error || "Failed to load driver dashboard.");
            }

            const nextRequests: Ride[] = payload.requests || [];
            if (silent && nextRequests.length > previousRequestCountRef.current) {
                const newRequestsCount = nextRequests.length - previousRequestCountRef.current;
                showToast(
                    newRequestsCount === 1
                        ? "New ride request nearby."
                        : `${newRequestsCount} new ride requests nearby.`,
                    "info"
                );
            }

            previousRequestCountRef.current = nextRequests.length;
            setRequests(nextRequests);
            setActiveRide(payload.activeRide || null);
            setRecentEarnings(payload.recentEarnings || []);
            setStats({
                completedTrips: Number(payload.stats?.completedTrips) || 0,
                acceptanceRate: Number(payload.stats?.acceptanceRate) || 0,
                todayEarnings: Number(payload.stats?.todayEarnings) || 0,
                todayPendingPayout: Number(payload.stats?.todayPendingPayout) || 0,
            });
            setSetupMessage(payload.setupRequired ? payload.error || "Supabase setup is required." : null);
            setLastUpdatedAt(new Date().toISOString());
        } catch (error) {
            if (!silent) {
                const message = error instanceof Error ? error.message : "Failed to load driver dashboard.";
                showToast(message, "error");
            }
        } finally {
            if (!silent) {
                setIsLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        if (!isLoaded || !user) return;

        void loadDriverState();

        if (!isOnline) {
            return;
        }

        const poller = window.setInterval(() => {
            void loadDriverState(true);
        }, 3000);

        return () => {
            window.clearInterval(poller);
        };
    }, [isLoaded, user, isOnline, loadDriverState]);

    useEffect(() => {
        if (!onlineStateInitializedRef.current) {
            onlineStateInitializedRef.current = true;
            return;
        }

        showToast(isOnline ? "You are online and receiving ride requests." : "You are offline.", "info");
    }, [isOnline]);

    const handleAcceptRide = async (ride: Ride) => {
        setUpdatingRideId(ride.id);

        try {
            const response = await fetch(`/api/driver/rides/${ride.id}/accept`, {
                method: "POST",
            });
            const payload = await response.json();

            if (!response.ok) {
                throw new Error(payload.error || "Failed to accept ride.");
            }

            setActiveRide(payload);
            setRequests((prev) => prev.filter((request) => request.id !== ride.id));
            showToast("Ride accepted. Head to pickup.", "success");
            await loadDriverState(true);
        } catch (error) {
            const message = error instanceof Error ? error.message : "Accept failed.";
            showToast(message, "error");
            await loadDriverState(true);
        } finally {
            setUpdatingRideId(null);
        }
    };

    const handleStartRide = async () => {
        if (!activeRide) return;

        setIsStartingRide(true);

        try {
            const response = await fetch(`/api/driver/rides/${activeRide.id}/start`, {
                method: "POST",
            });
            const payload = await response.json();

            if (!response.ok) {
                throw new Error(payload.error || "Failed to start ride.");
            }

            setActiveRide(payload);
            await loadDriverState(true);
            showToast("Trip started. Drive safely.", "success");
        } catch (error) {
            const message = error instanceof Error ? error.message : "Start failed.";
            showToast(message, "error");
        } finally {
            setIsStartingRide(false);
        }
    };

    const handleCompleteRide = async () => {
        if (!activeRide) return;

        setIsCompletingRide(true);

        try {
            const response = await fetch(`/api/driver/rides/${activeRide.id}/complete`, {
                method: "POST",
            });
            const payload = await response.json();

            if (!response.ok) {
                throw new Error(payload.error || "Failed to complete ride.");
            }

            setActiveRide(null);
            await loadDriverState(true);
            showToast("Ride completed! Great job. Earnings updated.", "success");
        } catch (error) {
            const message = error instanceof Error ? error.message : "Complete failed.";
            showToast(message, "error");
        } finally {
            setIsCompletingRide(false);
        }
    };

    const formatRelativeTime = (isoDate: string) => {
        const elapsedMs = Date.now() - new Date(isoDate).getTime();

        if (elapsedMs < 60_000) return "Just now";

        const elapsedMinutes = Math.floor(elapsedMs / 60_000);
        if (elapsedMinutes < 60) return `${elapsedMinutes}m ago`;

        const elapsedHours = Math.floor(elapsedMinutes / 60);
        if (elapsedHours < 24) return `${elapsedHours}h ago`;

        const elapsedDays = Math.floor(elapsedHours / 24);
        return `${elapsedDays}d ago`;
    };

    const formatDateTime = (isoDate: string) => {
        return new Intl.DateTimeFormat("en-IN", {
            day: "numeric",
            month: "short",
            hour: "numeric",
            minute: "2-digit",
        }).format(new Date(isoDate));
    };

    if (!isLoaded) return null;

    const activeRideStage = activeRide?.status === "accepted" ? "Heading to pickup" : "In Progress";
    const activeRideIsAccepted = activeRide?.status === "accepted";

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <nav className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
                <div className="flex items-center gap-8">
                    <Link href="/" className="text-xl font-bold tracking-tighter">
                        UBER<span className="text-blue-600">DRIVER</span>
                    </Link>
                    <div className="flex gap-4 text-xs font-bold uppercase tracking-widest text-gray-400">
                        <button
                            onClick={() => setActiveTab("opportunities")}
                            className={activeTab === "opportunities"
                                ? "text-blue-600 border-b-2 border-blue-600 pb-1"
                                : "hover:text-black"}
                        >
                            Opportunities
                        </button>
                        <button
                            onClick={() => setActiveTab("earnings")}
                            className={activeTab === "earnings"
                                ? "text-blue-600 border-b-2 border-blue-600 pb-1"
                                : "hover:text-black"}
                        >
                            Earnings
                        </button>
                    </div>
                </div>
                <UserButton afterSignOutUrl="/" />
            </nav>

            <main className="flex-grow p-6 md:p-12">
                <div className="max-w-6xl mx-auto grid lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        {setupMessage && (
                            <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl p-4 text-sm font-medium">
                                {setupMessage}
                            </div>
                        )}

                        <div className="bg-white rounded-2xl border border-gray-100 px-4 py-3 flex flex-wrap items-center gap-3 justify-between">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setIsOnline((prev) => !prev)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${isOnline
                                        ? "bg-green-100 text-green-700 hover:bg-green-200"
                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                        }`}
                                >
                                    {isOnline ? "Online" : "Offline"}
                                </button>
                                <button
                                    onClick={() => void loadDriverState()}
                                    disabled={isLoading}
                                    className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-2"
                                >
                                    <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
                                    Refresh
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 font-medium">
                                {lastUpdatedAt ? `Last sync: ${formatRelativeTime(lastUpdatedAt)}` : "Sync pending"}
                            </p>
                        </div>

                        <h2 className="text-3xl font-bold text-gray-900">
                            {activeTab === "opportunities"
                                ? (activeRide ? "Current Mission" : `Available Requests (${requests.length})`)
                                : "Earnings Overview"}
                        </h2>

                        {activeTab === "opportunities" ? (
                            activeRide ? (
                            <div className="bg-black text-white rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                                <div className="relative z-10 space-y-8">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-1">
                                            <p className="text-blue-400 text-xs font-bold uppercase tracking-widest">{activeRideStage}</p>
                                            <h3 className="text-2xl font-bold">Ride to {activeRide.dropoff_location}</h3>
                                        </div>
                                        <div className="bg-white/10 px-4 py-2 rounded-xl backdrop-blur-md">
                                            <p className="text-xl font-bold">{formatINR(activeRide.fare || 0)}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="flex gap-4">
                                            <div className="flex flex-col items-center gap-1">
                                                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                                <div className="w-0.5 h-12 bg-white/20"></div>
                                                <div className="w-3 h-3 bg-white"></div>
                                            </div>
                                            <div className="flex flex-col justify-between py-0.5 text-sm">
                                                <p className="text-gray-400 font-medium">Pickup: <span className="text-white">{activeRide.pickup_location}</span></p>
                                                <p className="text-gray-400 font-medium">Dropoff: <span className="text-white">{activeRide.dropoff_location}</span></p>
                                            </div>
                                        </div>
                                    </div>

                                    {activeRideIsAccepted ? (
                                        <button
                                            onClick={handleStartRide}
                                            disabled={isStartingRide}
                                            className="w-full bg-blue-600 hover:bg-blue-500 text-white py-5 rounded-2xl font-bold transition-all shadow-xl shadow-blue-900/20 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                                        >
                                            {isStartingRide ? <Loader2 className="animate-spin" size={24} /> : <Play size={22} />}
                                            Start Ride
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleCompleteRide}
                                            disabled={isCompletingRide}
                                            className="w-full bg-blue-600 hover:bg-blue-500 text-white py-5 rounded-2xl font-bold transition-all shadow-xl shadow-blue-900/20 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                                        >
                                            {isCompletingRide ? <Loader2 className="animate-spin" size={24} /> : <CheckCircle2 size={24} />}
                                            Complete Ride
                                        </button>
                                    )}
                                </div>
                            </div>
                        ) : isLoading ? (
                            <div className="bg-white rounded-3xl p-12 border border-gray-100 flex flex-col items-center justify-center text-center space-y-4">
                                <Loader2 className="animate-spin text-blue-600" size={28} />
                                <div className="space-y-1">
                                    <p className="text-gray-900 font-bold">Loading ride requests</p>
                                    <p className="text-gray-400 text-sm">Checking for nearby riders.</p>
                                </div>
                            </div>
                        ) : requests.length > 0 ? (
                            <div className="grid md:grid-cols-2 gap-4">
                                {requests.map((ride) => (
                                    <div key={ride.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all space-y-4">
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-2 text-blue-600">
                                                <Clock size={16} />
                                                <span className="text-sm font-bold">{formatRelativeTime(ride.created_at)}</span>
                                            </div>
                                            <span className="text-lg font-black text-gray-900">{formatINR(ride.fare || 0)}</span>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex items-start gap-3">
                                                <MapPin className="text-black shrink-0 mt-1" size={18} />
                                                <p className="text-sm text-gray-600 line-clamp-1">{ride.pickup_location}</p>
                                            </div>
                                            <div className="flex items-start gap-3">
                                                <Navigation className="text-blue-600 shrink-0 mt-1" size={18} />
                                                <p className="text-sm text-gray-600 line-clamp-1">{ride.dropoff_location}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleAcceptRide(ride)}
                                            disabled={updatingRideId === ride.id}
                                            className="w-full bg-black text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            {updatingRideId === ride.id && <Loader2 className="animate-spin" size={16} />}
                                            Accept Ride
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white rounded-3xl p-12 border border-dashed border-gray-200 flex flex-col items-center justify-center text-center space-y-4">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
                                    <Car size={32} />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-gray-900 font-bold">No requests nearby</p>
                                    <p className="text-gray-400 text-sm">Stay online to receive new opportunities.</p>
                                </div>
                            </div>
                        )) : (
                            <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden">
                                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                                    <p className="text-sm font-bold text-gray-700">Recent Completed Rides</p>
                                    <p className="text-xs font-semibold text-gray-500">Paid vs Pending payout</p>
                                </div>

                                {recentEarnings.length === 0 ? (
                                    <div className="p-10 text-center">
                                        <p className="text-gray-900 font-bold">No earnings yet</p>
                                        <p className="text-gray-400 text-sm mt-1">Complete rides to see payout details here.</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-gray-100">
                                        {recentEarnings.map((ride) => {
                                            const isPaid = ride.payment_status === "paid";

                                            return (
                                                <div key={ride.id} className="p-5 flex items-start justify-between gap-4">
                                                    <div className="space-y-2 min-w-0">
                                                        <p className="text-sm text-gray-500">{formatDateTime(ride.created_at)}</p>
                                                        <p className="text-sm font-semibold text-gray-800 truncate">{ride.pickup_location}</p>
                                                        <p className="text-sm text-gray-500 truncate">to {ride.dropoff_location}</p>
                                                    </div>
                                                    <div className="text-right shrink-0 space-y-2">
                                                        <p className="text-lg font-black text-gray-900">{formatINR(ride.fare || 0)}</p>
                                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${isPaid ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
                                                            {isPaid ? "Paid" : "Pending"}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="space-y-6">
                        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                            <h3 className="font-bold text-gray-900">Your Performance</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-gray-50 rounded-2xl">
                                    <p className="text-2xl font-black text-gray-900">{stats.completedTrips}</p>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Completed</p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-2xl">
                                    <p className="text-2xl font-black text-gray-900">{stats.acceptanceRate}%</p>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Acceptance</p>
                                </div>
                            </div>
                            <div className="pt-4 border-t border-gray-50">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500">Today&apos;s Paid Earnings</span>
                                    <span className="font-bold text-green-600">{formatINR(stats.todayEarnings)}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm mt-2">
                                    <span className="text-gray-500">Pending Payout</span>
                                    <span className="font-bold text-amber-600">{formatINR(stats.todayPendingPayout)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-blue-600 p-8 rounded-3xl text-white space-y-4 shadow-xl shadow-blue-200">
                            <h4 className="font-bold">Pro Tip</h4>
                            <p className="text-blue-100 text-sm leading-relaxed">
                                Head towards downtown. Demand is 2.5x higher than usual in your current area!
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
