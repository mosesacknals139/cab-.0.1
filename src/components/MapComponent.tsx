"use client";

import { useEffect, useState } from "react";
import L from "leaflet";
import { CircleMarker, MapContainer, Marker, Polyline, TileLayer, useMap, useMapEvents } from "react-leaflet";

interface Point {
    lat: number;
    lng: number;
}

interface SelectionPoint extends Point {
    address: string;
}

interface MapProps {
    pickup?: string;
    destination?: string;
    pickupCoords?: Point | null;
    destinationCoords?: Point | null;
    selectionTarget?: "pickup" | "destination";
    onPickupSelect?: (data: SelectionPoint) => void;
    onDestinationSelect?: (data: SelectionPoint) => void;
}

const chennaiCenter: [number, number] = [13.0827, 80.2707];

const pickupIcon = L.divIcon({
    className: "",
    html: '<div style="width:28px;height:28px;border-radius:9999px;background:#111827;color:#fff;display:flex;align-items:center;justify-content:center;font:700 12px Arial;border:2px solid #fff;box-shadow:0 8px 18px rgba(0,0,0,.24)">P</div>',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
});

const dropIcon = L.divIcon({
    className: "",
    html: '<div style="width:28px;height:28px;border-radius:9999px;background:#2563eb;color:#fff;display:flex;align-items:center;justify-content:center;font:700 12px Arial;border:2px solid #fff;box-shadow:0 8px 18px rgba(37,99,235,.32)">D</div>',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
});

function MapClickHandler({
    selectionTarget,
    onPickupSelect,
    onDestinationSelect,
}: {
    selectionTarget: "pickup" | "destination";
    onPickupSelect?: (data: SelectionPoint) => void;
    onDestinationSelect?: (data: SelectionPoint) => void;
}) {
    useMapEvents({
        click: async (event) => {
            const lat = event.latlng.lat;
            const lng = event.latlng.lng;
            let address = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

            try {
                const params = new URLSearchParams({
                    lat: lat.toString(),
                    lon: lng.toString(),
                    format: "jsonv2",
                    "accept-language": "en",
                });
                const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params.toString()}`);
                if (response.ok) {
                    const data = (await response.json()) as { display_name?: string };
                    if (data.display_name) address = data.display_name;
                }
            } catch {
                // Keep coordinate fallback.
            }

            const point = { address, lat, lng };
            if (selectionTarget === "pickup") {
                onPickupSelect?.(point);
            } else {
                onDestinationSelect?.(point);
            }
        },
    });

    return null;
}

function MapViewport({ pickupCoords, destinationCoords }: { pickupCoords?: Point | null; destinationCoords?: Point | null }) {
    const map = useMap();

    useEffect(() => {
        if (pickupCoords && destinationCoords) {
            map.fitBounds(
                [
                    [pickupCoords.lat, pickupCoords.lng],
                    [destinationCoords.lat, destinationCoords.lng],
                ],
                { padding: [60, 60] }
            );
            return;
        }

        if (pickupCoords) {
            map.flyTo([pickupCoords.lat, pickupCoords.lng], 14, { duration: 0.6 });
            return;
        }

        if (destinationCoords) {
            map.flyTo([destinationCoords.lat, destinationCoords.lng], 14, { duration: 0.6 });
        }
    }, [map, pickupCoords, destinationCoords]);

    return null;
}

export default function MapComponent({
    pickupCoords,
    destinationCoords,
    selectionTarget = "pickup",
    onPickupSelect,
    onDestinationSelect,
}: MapProps) {
    const [route, setRoute] = useState<[number, number][]>([]);
    const [routeError, setRouteError] = useState<string | null>(null);

    useEffect(() => {
        const controller = new AbortController();

        if (!pickupCoords || !destinationCoords) {
            return () => controller.abort();
        }

        const fetchRoute = async () => {
            try {
                const response = await fetch(
                    `https://router.project-osrm.org/route/v1/driving/${pickupCoords.lng},${pickupCoords.lat};${destinationCoords.lng},${destinationCoords.lat}?overview=full&geometries=geojson`,
                    { signal: controller.signal }
                );
                if (!response.ok) {
                    setRoute([]);
                    setRouteError("Route preview unavailable.");
                    return;
                }
                const data = (await response.json()) as {
                    routes?: Array<{ geometry?: { coordinates?: [number, number][] } }>;
                };
                const coordinates = data.routes?.[0]?.geometry?.coordinates ?? [];
                setRoute(coordinates.map(([lng, lat]) => [lat, lng]));
                setRouteError(null);
            } catch {
                setRouteError("Route preview unavailable.");
            }
        };

        void fetchRoute();
        return () => controller.abort();
    }, [pickupCoords, destinationCoords]);

    return (
        <div className="relative h-full w-full">
            <MapContainer center={chennaiCenter} zoom={12} className="h-full w-full" zoomControl={false}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapViewport pickupCoords={pickupCoords} destinationCoords={destinationCoords} />
                <MapClickHandler
                    selectionTarget={selectionTarget}
                    onPickupSelect={onPickupSelect}
                    onDestinationSelect={onDestinationSelect}
                />
                {pickupCoords && <Marker position={[pickupCoords.lat, pickupCoords.lng]} icon={pickupIcon} />}
                {destinationCoords && <Marker position={[destinationCoords.lat, destinationCoords.lng]} icon={dropIcon} />}
                {!pickupCoords && (
                    <CircleMarker center={chennaiCenter} radius={6} pathOptions={{ color: "#111827", fillColor: "#111827", fillOpacity: 1 }} />
                )}
                {pickupCoords && destinationCoords && route.length > 0 && (
                    <Polyline positions={route} pathOptions={{ color: "#2563eb", weight: 5, opacity: 0.85 }} />
                )}
            </MapContainer>

            <div className="absolute left-1/2 top-4 z-[500] -translate-x-1/2 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-gray-800 shadow-md">
                Click map to set {selectionTarget === "pickup" ? "Pickup" : "Drop"}
            </div>

            {pickupCoords && destinationCoords && routeError && (
                <div className="absolute bottom-4 left-1/2 z-[500] -translate-x-1/2 rounded-full bg-black/80 px-3 py-1.5 text-xs text-white">
                    {routeError}
                </div>
            )}
        </div>
    );
}
