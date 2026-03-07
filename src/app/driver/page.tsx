"use client";

import { useUser, UserButton } from "@clerk/nextjs";
import { useCallback, useEffect, useState } from "react";
import { showToast } from "@/components/Toast";
import type { Database } from "@/types/database";
import { Car, MapPin, Navigation, Clock, CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";
import { formatINR } from "@/lib/currency";

type Ride = Database["public"]["Tables"]["rides"]["Row"];

export default function DriverDashboard() {
    const { user, isLoaded } = useUser();
    const [requests, setRequests] = useState<Ride[]>([]);
    const [activeRide, setActiveRide] = useState<Ride | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [updatingRideId, setUpdatingRideId] = useState<string | null>(null);
    const [isCompletingRide, setIsCompletingRide] = useState(false);

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

            setRequests(payload.requests || []);
            setActiveRide(payload.activeRide || null);
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
        const poller = window.setInterval(() => {
            void loadDriverState(true);
        }, 3000);

        return () => {
            window.clearInterval(poller);
        };
    }, [isLoaded, user, loadDriverState]);

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
        } catch (error) {
            const message = error instanceof Error ? error.message : "Accept failed.";
            showToast(message, "error");
        } finally {
            setUpdatingRideId(null);
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

    if (!isLoaded) return null;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <nav className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
                <div className="flex items-center gap-8">
                    <Link href="/" className="text-xl font-bold tracking-tighter">
                        UBER<span className="text-blue-600">DRIVER</span>
                    </Link>
                    <div className="flex gap-4 text-xs font-bold uppercase tracking-widest text-gray-400">
                        <span className="text-blue-600 border-b-2 border-blue-600 pb-1">Opportunities</span>
                        <span className="hover:text-black cursor-pointer">Earnings</span>
                    </div>
                </div>
                <UserButton afterSignOutUrl="/" />
            </nav>

            <main className="flex-grow p-6 md:p-12">
                <div className="max-w-6xl mx-auto grid lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <h2 className="text-3xl font-bold text-gray-900">
                            {activeRide ? "Current Mission" : "Available Requests"}
                        </h2>

                        {activeRide ? (
                            <div className="bg-black text-white rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                                <div className="relative z-10 space-y-8">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-1">
                                            <p className="text-blue-400 text-xs font-bold uppercase tracking-widest">In Progress</p>
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

                                    <button
                                        onClick={handleCompleteRide}
                                        disabled={isCompletingRide}
                                        className="w-full bg-blue-600 hover:bg-blue-500 text-white py-5 rounded-2xl font-bold transition-all shadow-xl shadow-blue-900/20 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        {isCompletingRide ? <Loader2 className="animate-spin" size={24} /> : <CheckCircle2 size={24} />}
                                        Complete Ride
                                    </button>
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
                                                <span className="text-sm font-bold">Just now</span>
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
                        )}
                    </div>

                    <div className="space-y-6">
                        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                            <h3 className="font-bold text-gray-900">Your Performance</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-gray-50 rounded-2xl">
                                    <p className="text-2xl font-black text-gray-900">4.9</p>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Rating</p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-2xl">
                                    <p className="text-2xl font-black text-gray-900">98%</p>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Acceptance</p>
                                </div>
                            </div>
                            <div className="pt-4 border-t border-gray-50">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500">Today&apos;s Earnings</span>
                                    <span className="font-bold text-green-600">{formatINR(142.5)}</span>
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
