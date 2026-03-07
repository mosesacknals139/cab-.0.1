"use client";

import { useEffect, useRef, useState } from "react";

interface AutocompleteInputProps {
    placeholder: string;
    value: string;
    onChange: (value: string) => void;
    onPlaceSelect?: (data: { address: string; lat: number; lng: number }) => void;
    onFocus?: () => void;
    className?: string;
    icon?: React.ReactNode;
}

interface SearchResult {
    display_name: string;
    lat: string;
    lon: string;
}

export default function AutocompleteInput({
    placeholder,
    value,
    onChange,
    onPlaceSelect,
    onFocus,
    className,
    icon,
}: AutocompleteInputProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [results, setResults] = useState<SearchResult[]>([]);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const controller = new AbortController();

        if (value.trim().length < 3) {
            setResults([]);
            setLoading(false);
            return () => controller.abort();
        }

        const timeoutId = window.setTimeout(async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams({
                    q: value,
                    format: "jsonv2",
                    limit: "5",
                    countrycodes: "in",
                    "accept-language": "en",
                    viewbox: "76.0,13.6,80.35,8.0",
                    bounded: "0",
                });
                const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
                    signal: controller.signal,
                    headers: {
                        Accept: "application/json",
                    },
                });
                if (!response.ok) {
                    setResults([]);
                    return;
                }
                const data = (await response.json()) as SearchResult[];
                setResults(data);
                setOpen(true);
            } catch {
                setResults([]);
            } finally {
                setLoading(false);
            }
        }, 350);

        return () => {
            controller.abort();
            window.clearTimeout(timeoutId);
        };
    }, [value]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (!inputRef.current?.parentElement?.contains(event.target as Node)) {
                setOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

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
                value={value}
                onChange={(e) => {
                    onChange(e.target.value);
                    setOpen(true);
                }}
                onFocus={() => {
                    onFocus?.();
                    if (results.length > 0) setOpen(true);
                }}
                autoComplete="off"
            />
            {open && (results.length > 0 || loading) && (
                <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
                    {loading && (
                        <div className="px-4 py-3 text-sm text-gray-500 dark:text-zinc-400">
                            Searching addresses...
                        </div>
                    )}
                    {!loading &&
                        results.map((result) => (
                            <button
                                key={`${result.lat}-${result.lon}`}
                                type="button"
                                className="block w-full border-b border-gray-100 px-4 py-3 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50 last:border-b-0 dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-900"
                                onClick={() => {
                                    onChange(result.display_name);
                                    onPlaceSelect?.({
                                        address: result.display_name,
                                        lat: Number(result.lat),
                                        lng: Number(result.lon),
                                    });
                                    setOpen(false);
                                }}
                            >
                                {result.display_name}
                            </button>
                        ))}
                </div>
            )}
        </div>
    );
}
