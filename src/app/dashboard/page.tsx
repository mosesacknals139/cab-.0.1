"use client";

import { useUser, UserButton } from "@clerk/nextjs";
import { Navigation, Car, Shield, Loader2, User, ArrowLeft, type LucideIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import AutocompleteInput from "@/components/AutocompleteInput";
import { showToast } from "@/components/Toast";
import PaymentModal from "@/components/PaymentModal";
import { formatINR } from "@/lib/currency";
import { Receipt } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type RidePoint = { address: string; lat: number; lng: number };
type RideStatus = "requested" | "accepted" | "ongoing" | "completed" | "cancelled";
type RideOptionId = "uberx" | "comfort" | "black";
type RideOption = {
    id: RideOptionId;
    name: string;
    time: string;
    icon: LucideIcon;
    desc: string;
    surcharge: number;
};

const RIDE_OPTIONS: RideOption[] = [
    { id: "uberx", name: "UberX", time: "5 min away", icon: Car, desc: "Fast, everyday rides", surcharge: 0 },
    { id: "comfort", name: "Uber Comfort", time: "3 min away", icon: Shield, desc: "Newer cars, extra legroom", surcharge: 120 },
    { id: "black", name: "Uber Black", time: "8 min away", icon: Navigation, desc: "Luxury rides with top-rated drivers", surcharge: 260 },
];

const MapComponent = dynamic(() => import("@/components/MapComponent"), {
    ssr: false,
    loading: () => (
        <div className="flex h-full w-full items-center justify-center bg-gray-100 text-sm text-gray-500 dark:bg-zinc-900 dark:text-zinc-400">
            Loading map...
        </div>
    ),
});

export default function Dashboard() {
    const BASE_FARE_INR = 249;
    const { user, isLoaded } = useUser();
    const [pickup, setPickup] = useState("");
    const [destination, setDestination] = useState("");
    const [pickupPoint, setPickupPoint] = useState<RidePoint | null>(null);
    const [destinationPoint, setDestinationPoint] = useState<RidePoint | null>(null);
    const [selectionTarget, setSelectionTarget] = useState<"pickup" | "destination">("pickup");
    const [estimatedFare, setEstimatedFare] = useState(BASE_FARE_INR);
    const [selectedRideType, setSelectedRideType] = useState<RideOptionId>("uberx");
    const [isConfirming, setIsConfirming] = useState(false);
    const [isBooking, setIsBooking] = useState(false);
    const [rideId, setRideId] = useState<string | null>(null);
    const [showPayment, setShowPayment] = useState(false);
    const [completedRideId, setCompletedRideId] = useState<string | null>(null);
    const [completedRideFare, setCompletedRideFare] = useState<number | null>(null);
    const [currentRideStatus, setCurrentRideStatus] = useState<RideStatus | null>(null);
    const rideStatusRef = useRef<RideStatus | null>(null);
    const rideStatusErrorNotifiedRef = useRef(false);
    const selectedRide = RIDE_OPTIONS.find((ride) => ride.id === selectedRideType) ?? RIDE_OPTIONS[0];
    const selectedRideFare = estimatedFare + selectedRide.surcharge;

    // Sync user with Supabase on mount
    useEffect(() => {
        if (isLoaded && user) {
            fetch("/api/user/sync", { method: "POST" })
                .catch(err => console.error("Sync failed:", err));
        }
    }, [isLoaded, user]);

    // Poll ride updates for real backend rides
    useEffect(() => {
        if (!rideId) return;

        let cancelled = false;
        const syncRideStatus = async () => {
            try {
                const response = await fetch(`/api/ride/${rideId}`, {
                    cache: "no-store",
                });
                const contentType = response.headers.get("content-type") || "";
                const payload = contentType.includes("application/json")
                    ? await response.json()
                    : { error: await response.text() };

                if (!response.ok) {
                    if (!rideStatusErrorNotifiedRef.current) {
                        showToast(payload.error || "Unable to refresh ride status right now.", "error");
                        rideStatusErrorNotifiedRef.current = true;
                    }
                    return;
                }

                if (cancelled) return;

                const nextStatus = payload.status as RideStatus;
                const previousStatus = rideStatusRef.current;
                rideStatusErrorNotifiedRef.current = false;

                rideStatusRef.current = nextStatus;
                setCurrentRideStatus(nextStatus);

                if (nextStatus === previousStatus) {
                    return;
                }

                if (nextStatus === "accepted") {
                    showToast("A driver has accepted your ride! They're on the way.", "success");
                }

                if (nextStatus === "completed") {
                    showToast("Your ride is complete! Proceed to payment.", "success");
                    setCompletedRideId(rideId);
                    setCompletedRideFare(Number(payload.fare) || selectedRideFare);
                    setShowPayment(true);
                    setRideId(null);
                    resetRideDraft();
                }

                if (nextStatus === "cancelled") {
                    showToast("Your ride was cancelled.", "error");
                    setRideId(null);
                    resetRideDraft();
                }
            } catch {
                if (cancelled) return;

                if (!rideStatusErrorNotifiedRef.current) {
                    showToast("Unable to refresh ride status. Retrying...", "error");
                    rideStatusErrorNotifiedRef.current = true;
                }
            }
        };

        void syncRideStatus();
        const poller = window.setInterval(() => {
            void syncRideStatus();
        }, 3000);

        return () => {
            cancelled = true;
            window.clearInterval(poller);
        };
    }, [rideId, selectedRideFare]);

    useEffect(() => {
        if (!pickupPoint || !destinationPoint) {
            setEstimatedFare(BASE_FARE_INR);
            return;
        }

        const toRad = (v: number) => (v * Math.PI) / 180;
        const R = 6371;
        const dLat = toRad(destinationPoint.lat - pickupPoint.lat);
        const dLng = toRad(destinationPoint.lng - pickupPoint.lng);
        const lat1 = toRad(pickupPoint.lat);
        const lat2 = toRad(destinationPoint.lat);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);
        const distanceKm = 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const dynamicFare = Math.max(BASE_FARE_INR, Math.round(80 + distanceKm * 24));
        setEstimatedFare(dynamicFare);
    }, [pickupPoint, destinationPoint]);

    const handlePickupSelect = (point: RidePoint) => {
        setPickup(point.address);
        setPickupPoint(point);
        setSelectionTarget("destination");
    };

    const handleDestinationSelect = (point: RidePoint) => {
        setDestination(point.address);
        setDestinationPoint(point);
    };

    const resetRideDraft = () => {
        setPickup("");
        setDestination("");
        setPickupPoint(null);
        setDestinationPoint(null);
        setEstimatedFare(BASE_FARE_INR);
        setSelectedRideType("uberx");
        setSelectionTarget("pickup");
        setIsConfirming(false);
        setCurrentRideStatus(null);
        rideStatusRef.current = null;
        rideStatusErrorNotifiedRef.current = false;
    };

    const handleRequestRide = async () => {
        if (!pickupPoint || !destinationPoint) {
            showToast("Select pickup and drop points from map or address suggestions.", "error");
            return;
        }

        setIsBooking(true);
        try {
            const response = await fetch("/api/ride", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    pickup_location: pickup,
                    dropoff_location: destination,
                    pickup_lat: pickupPoint.lat,
                    pickup_lng: pickupPoint.lng,
                    dropoff_lat: destinationPoint.lat,
                    dropoff_lng: destinationPoint.lng,
                    fare: selectedRideFare,
                }),
            });

            const contentType = response.headers.get("content-type") || "";
            const payload = contentType.includes("application/json")
                ? await response.json()
                : { error: await response.text() };

            if (!response.ok) {
                showToast(payload.error || "Booking failed. Please try again.", "error");
                return;
            }

            if (payload.id) {
                setRideId(payload.id);
                rideStatusRef.current = (payload.status as RideStatus | undefined) || "requested";
                setCurrentRideStatus((payload.status as RideStatus | undefined) || "requested");
                rideStatusErrorNotifiedRef.current = false;
                showToast("Ride requested! Searching for nearby drivers...", "info");
            } else {
                showToast("Booking failed. Please try again.", "error");
            }
        } catch (error) {
            console.error("Ride request failed:", error);
            showToast("Ride request failed. Check your connection and try again.", "error");
        } finally {
            setIsBooking(false);
        }
    };

    if (!isLoaded) return null;

    const handleCancelRideRequest = async () => {
        if (!rideId) return;

        try {
            const response = await fetch(`/api/ride/${rideId}/cancel`, {
                method: "POST",
            });
            const payload = await response.json();

            if (!response.ok) {
                throw new Error(payload.error || "Failed to cancel ride.");
            }

            setRideId(null);
            resetRideDraft();
            showToast("Ride request cancelled.", "info");
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to cancel ride.";
            showToast(message, "error");
        }
    };

    return (
        <div className="flex flex-col h-screen bg-white dark:bg-background md:flex-row overflow-hidden transition-colors duration-300">
            {/* Sidebar / Search Section */}
            <motion.div
                initial={{ x: -300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="w-full md:w-[450px] flex flex-col h-full border-r border-gray-100 dark:border-zinc-800 z-10 bg-white dark:bg-zinc-950 shadow-2xl"
            >
                <div className="p-6 border-b border-gray-50 dark:border-zinc-900 flex items-center justify-between">
                    <Link href="/" className="text-xl font-bold tracking-tighter dark:text-white">
                        UBER<span className="text-blue-600">CLONE</span>
                    </Link>
                    <UserButton afterSignOutUrl="/" />
                </div>

                <div className="flex-grow overflow-y-auto p-6 space-y-8">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={rideId ? 'finding' : isConfirming ? 'confirming' : 'searching'}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-2"
                        >
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">
                                {rideId ? 'Finding your driver...' : isConfirming ? 'Confirm your trip' : `Where to, ${user?.firstName || 'User'}?`}
                            </h1>
                            <p className="text-gray-500 dark:text-zinc-400 text-sm">
                                {rideId ? 'Your request has been sent to nearby drivers.' : isConfirming ? 'Review your selection and pay' : 'Enter your trip details to get started.'}
                            </p>
                        </motion.div>
                    </AnimatePresence>

                    {!rideId && (
                        <motion.div
                            layout
                            className="relative space-y-4"
                        >
                            <div className="absolute left-[17px] top-[24px] bottom-[24px] w-0.5 bg-gray-200 dark:bg-zinc-800"></div>

                            <AutocompleteInput
                                placeholder="Pickup (e.g. T. Nagar, Chennai)"
                                value={pickup}
                                onChange={setPickup}
                                onPlaceSelect={handlePickupSelect}
                                onFocus={() => setSelectionTarget("pickup")}
                                className="w-full pl-10 pr-4 py-4 bg-gray-50 dark:bg-zinc-900 border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-zinc-800 rounded-2xl transition-all outline-none text-sm font-medium dark:text-white"
                                icon={<div className="w-2 h-2 rounded-full bg-black dark:bg-white"></div>}
                            />

                            <AutocompleteInput
                                placeholder="Drop (e.g. Tambaram, Chennai)"
                                value={destination}
                                onChange={setDestination}
                                onPlaceSelect={handleDestinationSelect}
                                onFocus={() => setSelectionTarget("destination")}
                                className="w-full pl-10 pr-4 py-4 bg-gray-50 dark:bg-zinc-900 border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-zinc-800 rounded-2xl transition-all outline-none text-sm font-medium dark:text-white"
                                icon={<div className="w-2 h-2 bg-blue-600"></div>}
                            />
                        </motion.div>
                    )}

                    <AnimatePresence>
                        {!rideId && !isConfirming && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="space-y-4 pt-4 overflow-visible"
                            >
                                <h3 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wider">Suggested Rides</h3>
                                <div className="space-y-3">
                                    {RIDE_OPTIONS.map((ride, i) => {
                                        const isSelected = ride.id === selectedRideType;

                                        return (
                                        <motion.button
                                            key={ride.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.1 }}
                                            onClick={() => setSelectedRideType(ride.id)}
                                            className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${isSelected ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-900/10 ring-1 ring-blue-600' : 'border-gray-100 dark:border-zinc-800 hover:border-gray-200 dark:hover:border-zinc-700'}`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`p-3 rounded-xl ${isSelected ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 dark:shadow-none' : 'bg-gray-100 dark:bg-zinc-800 text-black dark:text-white'}`}>
                                                    <ride.icon size={22} />
                                                </div>
                                                <div className="text-left">
                                                    <p className="font-bold text-sm text-gray-900 dark:text-white">{ride.name}</p>
                                                    <p className="text-[10px] uppercase font-bold text-gray-400 dark:text-zinc-500">{ride.time}</p>
                                                    <p className="text-xs text-gray-500 dark:text-zinc-400">{ride.desc}</p>
                                                </div>
                                            </div>
                                            <p className="font-bold text-base text-gray-900 dark:text-white">{formatINR(estimatedFare + ride.surcharge)}</p>
                                        </motion.button>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {!rideId && isConfirming && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-3xl border border-blue-100 dark:border-blue-900/30 space-y-4"
                        >
                            <div className="flex justify-between items-center">
                                <div className="space-y-1">
                                    <span className="font-bold text-blue-900 dark:text-blue-300">{selectedRide.name}</span>
                                    <p className="text-xs text-blue-700 dark:text-blue-400">{selectedRide.desc}</p>
                                </div>
                                <span className="text-2xl font-black text-blue-900 dark:text-blue-300">{formatINR(selectedRideFare)}</span>
                            </div>
                            <p className="text-xs text-blue-700 dark:text-blue-400">Includes all taxes and fees. Driver will arrive in approx. {selectedRide.time.toLowerCase()}.</p>
                        </motion.div>
                    )}

                    {rideId ? (
                        <div className="flex flex-col items-center justify-center p-12 space-y-6 text-center">
                            <div className="relative">
                                <motion.div
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{ repeat: Infinity, duration: 2 }}
                                    className="absolute inset-0 bg-blue-100 dark:bg-blue-900/30 rounded-full opacity-50"
                                ></motion.div>
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                                    className="relative w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center text-white"
                                >
                                    <Car size={40} />
                                </motion.div>
                            </div>
                            <motion.p
                                animate={{ opacity: [0.5, 1, 0.5] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className="text-gray-600 dark:text-zinc-400 font-medium"
                            >
                                {currentRideStatus === "accepted" ? "Driver assigned. They're heading to pickup." : "Matching you with the nearest driver..."}
                            </motion.p>
                            <button
                                onClick={handleCancelRideRequest}
                                className="text-red-600 font-bold text-sm hover:underline"
                            >
                                Cancel Request
                            </button>
                        </div>
                    ) : (
                        <div className="pt-4">
                            <button
                                onClick={() => isConfirming ? handleRequestRide() : setIsConfirming(true)}
                                disabled={!pickup || !destination || isBooking}
                                className="w-full bg-black dark:bg-white text-white dark:text-black py-5 rounded-2xl font-bold hover:bg-gray-800 dark:hover:bg-zinc-200 transition-all shadow-xl shadow-gray-200 dark:shadow-none disabled:opacity-50 disabled:cursor-not-allowed text-lg active:scale-95 flex items-center justify-center gap-2"
                            >
                                {isBooking && <Loader2 className="animate-spin" />}
                                {isConfirming ? `Request ${selectedRide.name}` : `Choose ${selectedRide.name}`}
                            </button>
                            {isConfirming && (
                                <button
                                    onClick={() => setIsConfirming(false)}
                                    className="w-full mt-4 text-sm font-bold text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                                >
                                    Go Back
                                </button>
                            )}
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-gray-100 dark:border-zinc-900 bg-gray-50/50 dark:bg-zinc-950 space-y-3">
                    <Link href="/rides" className="flex items-center justify-between group">
                        <div className="flex items-center gap-3 text-gray-900 dark:text-zinc-200 group-hover:text-blue-600 transition-colors">
                            <Receipt className="w-5 h-5" />
                            <span className="text-sm font-bold">Ride History</span>
                        </div>
                        <ArrowLeft className="w-4 h-4 rotate-180 text-gray-400 group-hover:text-blue-600 transition-colors" />
                    </Link>
                    <Link href="/profile" className="flex items-center justify-between group">
                        <div className="flex items-center gap-3 text-gray-900 dark:text-zinc-200 group-hover:text-blue-600 transition-colors">
                            <User className="w-5 h-5" />
                            <span className="text-sm font-bold">Profile & Account</span>
                        </div>
                        <ArrowLeft className="w-4 h-4 rotate-180 text-gray-400 group-hover:text-blue-600 transition-colors" />
                    </Link>

                    <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-zinc-900">
                        <div className="flex items-center gap-3 text-gray-900 dark:text-zinc-200">
                            <div className="w-10 h-6 bg-gray-200 dark:bg-zinc-800 rounded flex items-center justify-center font-bold text-[10px]">VISA</div>
                            <span className="text-sm font-bold">•••• 4242</span>
                        </div>
                        <button className="text-blue-600 text-sm font-bold">Switch</button>
                    </div>
                </div>
            </motion.div>

            {/* Map Section */}
            <div className="flex-grow relative bg-gray-100 dark:bg-zinc-900">
                <MapComponent
                    pickup={pickup}
                    destination={destination}
                    pickupCoords={pickupPoint ? { lat: pickupPoint.lat, lng: pickupPoint.lng } : null}
                    destinationCoords={destinationPoint ? { lat: destinationPoint.lat, lng: destinationPoint.lng } : null}
                    selectionTarget={selectionTarget}
                    onPickupSelect={handlePickupSelect}
                    onDestinationSelect={handleDestinationSelect}
                />
            </div>

            {/* Stripe Payment Modal */}
            <AnimatePresence>
                {showPayment && completedRideId && (
                    <PaymentModal
                        rideId={completedRideId}
                        fare={completedRideFare ?? selectedRideFare}
                        onClose={() => {
                            setShowPayment(false);
                            setCompletedRideFare(null);
                        }}
                        onSuccess={() => {
                            setShowPayment(false);
                            setCompletedRideFare(null);
                            showToast("Payment received! Thank you.", "success");
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
