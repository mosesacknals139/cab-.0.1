"use client";

import { useEffect, useRef, useState } from "react";

interface MapProps {
    pickup?: string;
    destination?: string;
}

declare global {
    interface Window {
        google: typeof google;
        initGoogleMap?: () => void;
    }
}

export default function MapComponent({ pickup, destination }: MapProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<google.maps.Map | null>(null);
    const rendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load Google Maps script once
    useEffect(() => {
        if (window.google?.maps) {
            setIsLoaded(true);
            return;
        }

        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
        const scriptId = "google-maps-script";

        if (document.getElementById(scriptId)) return;

        window.initGoogleMap = () => setIsLoaded(true);

        const script = document.createElement("script");
        script.id = scriptId;
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry&callback=initGoogleMap`;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);

        return () => {
            delete window.initGoogleMap;
        };
    }, []);

    // Initialize map after script load
    useEffect(() => {
        if (!isLoaded || !mapRef.current || mapInstanceRef.current) return;

        const map = new google.maps.Map(mapRef.current, {
            center: { lat: 40.7128, lng: -74.006 },
            zoom: 12,
            disableDefaultUI: true,
            styles: [
                { featureType: "poi", stylers: [{ visibility: "off" }] },
                { featureType: "transit", stylers: [{ visibility: "off" }] },
                {
                    featureType: "all",
                    elementType: "labels.text.fill",
                    stylers: [{ color: "#9ca3af" }],
                },
                {
                    featureType: "water",
                    elementType: "geometry",
                    stylers: [{ color: "#dbeafe" }],
                },
                {
                    featureType: "road",
                    elementType: "geometry",
                    stylers: [{ color: "#ffffff" }],
                },
                {
                    featureType: "landscape",
                    elementType: "geometry",
                    stylers: [{ color: "#f3f4f6" }],
                },
            ],
        });

        const renderer = new google.maps.DirectionsRenderer({
            suppressMarkers: false,
            polylineOptions: {
                strokeColor: "#2563eb",
                strokeWeight: 5,
                strokeOpacity: 0.9,
            },
        });
        renderer.setMap(map);

        mapInstanceRef.current = map;
        rendererRef.current = renderer;
    }, [isLoaded]);

    // Update directions when pickup/destination change
    useEffect(() => {
        if (!isLoaded || !mapInstanceRef.current || !rendererRef.current) return;
        if (!pickup || !destination) return;

        const directionsService = new google.maps.DirectionsService();
        directionsService.route(
            {
                origin: pickup,
                destination: destination,
                travelMode: google.maps.TravelMode.DRIVING,
            },
            (result, status) => {
                if (status === google.maps.DirectionsStatus.OK && result) {
                    rendererRef.current!.setDirections(result);
                } else {
                    console.warn("Directions error:", status);
                }
            }
        );
    }, [pickup, destination, isLoaded]);

    return (
        <div className="relative h-full w-full">
            <div ref={mapRef} className="h-full w-full" />
            {!isLoaded && (
                <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3 text-gray-500">
                        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        <p className="text-sm font-medium">Loading map...</p>
                    </div>
                </div>
            )}
        </div>
    );
}
