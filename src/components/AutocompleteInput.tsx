"use client";

import { useEffect, useRef } from "react";

interface AutocompleteInputProps {
    placeholder: string;
    value: string;
    onChange: (value: string) => void;
    className?: string;
    icon?: React.ReactNode;
}

export default function AutocompleteInput({
    placeholder,
    value,
    onChange,
    className,
    icon,
}: AutocompleteInputProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

    useEffect(() => {
        const initAutocomplete = () => {
            if (!inputRef.current || !window.google?.maps?.places) return;
            if (autocompleteRef.current) return;

            const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
                fields: ["formatted_address", "geometry"],
                types: ["address"],
            });

            autocomplete.addListener("place_changed", () => {
                const place = autocomplete.getPlace();
                if (place.formatted_address) {
                    onChange(place.formatted_address);
                }
            });

            autocompleteRef.current = autocomplete;
        };

        // Check if Google Maps is already loaded
        if (window.google?.maps?.places) {
            initAutocomplete();
        } else {
            // Poll until it's loaded (MapComponent loads it)
            const interval = setInterval(() => {
                if (window.google?.maps?.places) {
                    initAutocomplete();
                    clearInterval(interval);
                }
            }, 300);
            return () => clearInterval(interval);
        }
    }, [onChange]);

    return (
        <div className="relative">
            {icon && (
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
                    {icon}
                </div>
            )}
            <input
                ref={inputRef}
                type="text"
                placeholder={placeholder}
                className={className}
                defaultValue={value}
                onChange={(e) => onChange(e.target.value)}
            />
        </div>
    );
}
