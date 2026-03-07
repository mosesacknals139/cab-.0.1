"use client";

import { useEffect, useRef, useState } from "react";
import L, {
    type CircleMarker as LeafletCircleMarker,
    type LeafletMouseEvent,
    type Map as LeafletMap,
    type Marker as LeafletMarker,
    type Polyline as LeafletPolyline,
} from "leaflet";

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

export default function MapComponent({
    pickupCoords,
    destinationCoords,
    selectionTarget = "pickup",
    onPickupSelect,
    onDestinationSelect,
}: MapProps) {
    const mapContainerRef = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<LeafletMap | null>(null);
    const pickupMarkerRef = useRef<LeafletMarker | null>(null);
    const destinationMarkerRef = useRef<LeafletMarker | null>(null);
    const centerMarkerRef = useRef<LeafletCircleMarker | null>(null);
    const routePolylineRef = useRef<LeafletPolyline | null>(null);
    const selectionTargetRef = useRef(selectionTarget);
    const onPickupSelectRef = useRef(onPickupSelect);
    const onDestinationSelectRef = useRef(onDestinationSelect);
    const [route, setRoute] = useState<[number, number][]>([]);
    const [routeError, setRouteError] = useState<string | null>(null);

    useEffect(() => {
        selectionTargetRef.current = selectionTarget;
    }, [selectionTarget]);

    useEffect(() => {
        onPickupSelectRef.current = onPickupSelect;
    }, [onPickupSelect]);

    useEffect(() => {
        onDestinationSelectRef.current = onDestinationSelect;
    }, [onDestinationSelect]);

    useEffect(() => {
        const container = mapContainerRef.current;
        if (!container) return;

        if ("_leaflet_id" in container) {
            delete (container as HTMLDivElement & { _leaflet_id?: number })._leaflet_id;
        }

        const map = L.map(container, {
            center: chennaiCenter,
            zoom: 12,
            zoomControl: false,
        });

        mapRef.current = map;

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map);

        const handleMapClick = async (event: LeafletMouseEvent) => {
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
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?${params.toString()}`
                );
                if (response.ok) {
                    const data = (await response.json()) as { display_name?: string };
                    if (data.display_name) address = data.display_name;
                }
            } catch {
                // Keep coordinate fallback.
            }

            const point = { address, lat, lng };
            if (selectionTargetRef.current === "pickup") {
                onPickupSelectRef.current?.(point);
            } else {
                onDestinationSelectRef.current?.(point);
            }
        };

        map.on("click", handleMapClick);
        window.setTimeout(() => map.invalidateSize(), 0);

        return () => {
            map.off("click", handleMapClick);
            map.remove();
            mapRef.current = null;
        };
    }, []);

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
                if (!controller.signal.aborted) {
                    setRoute([]);
                    setRouteError("Route preview unavailable.");
                }
            }
        };

        void fetchRoute();
        return () => controller.abort();
    }, [pickupCoords, destinationCoords]);

    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        if (pickupMarkerRef.current) {
            pickupMarkerRef.current.remove();
            pickupMarkerRef.current = null;
        }

        if (destinationMarkerRef.current) {
            destinationMarkerRef.current.remove();
            destinationMarkerRef.current = null;
        }

        if (centerMarkerRef.current) {
            centerMarkerRef.current.remove();
            centerMarkerRef.current = null;
        }

        if (pickupCoords) {
            pickupMarkerRef.current = L.marker([pickupCoords.lat, pickupCoords.lng], {
                icon: pickupIcon,
            }).addTo(map);
        } else {
            centerMarkerRef.current = L.circleMarker(chennaiCenter, {
                radius: 6,
                color: "#111827",
                fillColor: "#111827",
                fillOpacity: 1,
            }).addTo(map);
        }

        if (destinationCoords) {
            destinationMarkerRef.current = L.marker(
                [destinationCoords.lat, destinationCoords.lng],
                { icon: dropIcon }
            ).addTo(map);
        }
    }, [pickupCoords, destinationCoords]);

    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        if (routePolylineRef.current) {
            routePolylineRef.current.remove();
            routePolylineRef.current = null;
        }

        if (pickupCoords && destinationCoords && route.length > 0) {
            routePolylineRef.current = L.polyline(route, {
                color: "#2563eb",
                weight: 5,
                opacity: 0.85,
            }).addTo(map);
        }
    }, [pickupCoords, destinationCoords, route]);

    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

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
            map.flyTo([destinationCoords.lat, destinationCoords.lng], 14, {
                duration: 0.6,
            });
            return;
        }

        map.flyTo(chennaiCenter, 12, { duration: 0.6 });
    }, [pickupCoords, destinationCoords]);

    return (
        <div className="relative h-full w-full">
            <div ref={mapContainerRef} className="h-full w-full" />

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
