"use client";

import { useUser, UserButton } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import { showToast } from "@/components/Toast";

import { Car, MapPin, Navigation, Clock, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";

export default function DriverDashboard() {
    const { user, isLoaded } = useUser();
    const [requests, setRequests] = useState<any[]>([]);
    const [activeRide, setActiveRide] = useState<any>(null);

    useEffect(() => {
        if (!isLoaded || !user) return;

        // Fetch initial requested rides
        const fetchRequests = async () => {
            const { data } = await supabase
                .from("rides")
                .select("*")
                .eq("status", "requested")
                .order("created_at", { ascending: false });

            setRequests(data || []);
        };

        fetchRequests();

        // Subscribe to new ride requests
        const channel = supabase
            .channel("ride-requests")
            .on(
                "postgres_changes",
                { event: "INSERT", schema: "public", table: "rides" },
                (payload) => {
                    if (payload.new.status === "requested") {
                        setRequests((prev) => [payload.new, ...prev]);
                    }
                }
            )
            .on(
                "postgres_changes",
                { event: "UPDATE", schema: "public", table: "rides" },
                (payload) => {
                    if (payload.new.status !== "requested") {
                        setRequests((prev) => prev.filter(r => r.id !== payload.new.id));
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [isLoaded, user]);

    const handleAcceptRide = async (ride: any) => {
        try {
            const { data, error } = await supabase
                .from("rides")
                .update({
                    status: "accepted",
                    driver_id: user?.id
                })
                .eq("id", ride.id)
                .select()
                .single();

            if (error) throw error;
            setActiveRide(data);
        } catch (error) {
            console.error("Accept failed:", error);
        }
    };

    const handleCompleteRide = async () => {
        if (!activeRide) return;
        try {
            await supabase
                .from("rides")
                .update({ status: "completed" })
                .eq("id", activeRide.id);

            setActiveRide(null);
            showToast("Ride completed! Great job. Earnings updated.", "success");
        } catch (error) {
            console.error("Complete failed:", error);
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

                    {/* Active Ride Section */}
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
                                            <p className="text-xl font-bold">${activeRide.fare}</p>
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
                                        className="w-full bg-blue-600 hover:bg-blue-500 text-white py-5 rounded-2xl font-bold transition-all shadow-xl shadow-blue-900/20 flex items-center justify-center gap-2"
                                    >
                                        <CheckCircle2 size={24} />
                                        Complete Ride
                                    </button>
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
                                            <span className="text-lg font-black text-gray-900">${ride.fare}</span>
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
                                            className="w-full bg-black text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition-all"
                                        >
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

                    {/* Sidebar Stats */}
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
                                    <span className="text-gray-500">Today's Earnings</span>
                                    <span className="font-bold text-green-600">$142.50</span>
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
