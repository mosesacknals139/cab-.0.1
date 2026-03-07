"use client";

import { useUser } from "@clerk/nextjs";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import { Star, MessageSquare, ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { showToast } from "@/components/Toast";
import { getDemoRideById, saveDemoRideRating } from "@/lib/demo-rides";

const QUICK_COMPLIMENTS = [
    "Great driver", "Very punctual", "Clean car",
    "Safe driving", "Friendly", "Smooth ride",
];

export default function RatePage() {
    const { user, isLoaded } = useUser();
    const params = useParams();
    const router = useRouter();
    const [rating, setRating] = useState(0);
    const [hovered, setHovered] = useState(0);
    const [comment, setComment] = useState("");
    const [tags, setTags] = useState<string[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const toggleTag = (tag: string) => {
        setTags((prev) =>
            prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
        );
    };

    const handleSubmit = async () => {
        if (rating === 0) {
            showToast("Please select a star rating", "error");
            return;
        }
        setSubmitting(true);
        try {
            const demoRide = getDemoRideById(params?.id as string);

            if (demoRide?.demo_mode) {
                saveDemoRideRating(demoRide.id, {
                    rating,
                    comment: comment || null,
                    tags: tags.length > 0 ? tags : null,
                    created_at: new Date().toISOString(),
                });
                setSubmitted(true);
                showToast("Thanks for your feedback!", "success");
                setTimeout(() => router.push("/rides"), 2000);
                return;
            }

            const { error } = await supabase.from("ratings").insert({
                ride_id: params?.id,
                rider_id: user?.id,
                rating,
                comment: comment || null,
                tags: tags.length > 0 ? tags : null,
            });

            if (error) throw error;
            setSubmitted(true);
            showToast("Thanks for your feedback!", "success");
            setTimeout(() => router.push("/rides"), 2000);
        } catch (error) {
            console.error(error);
            showToast("Failed to submit rating. Please try again.", "error");
        } finally {
            setSubmitting(false);
        }
    };

    if (!isLoaded) return null;

    if (submitted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center space-y-4">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle2 className="text-green-600" size={40} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Thanks for rating!</h2>
                    <p className="text-gray-500">Redirecting to your trips...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-md mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <Link href="/rides" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ArrowLeft size={20} />
                    </Link>
                    <h1 className="text-xl font-bold">Rate Your Driver</h1>
                </div>

                <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
                    {/* Driver mock */}
                    <div className="p-8 border-b border-gray-100 flex flex-col items-center gap-3">
                        <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-3xl font-black">
                            D
                        </div>
                        <div className="text-center">
                            <p className="font-bold text-gray-900 text-lg">Your Driver</p>
                            <p className="text-gray-400 text-sm">How was your trip?</p>
                        </div>
                    </div>

                    <div className="p-8 space-y-8">
                        {/* Stars */}
                        <div className="flex justify-center gap-3">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    onClick={() => setRating(star)}
                                    onMouseEnter={() => setHovered(star)}
                                    onMouseLeave={() => setHovered(0)}
                                    className="transition-transform hover:scale-125 focus:outline-none"
                                >
                                    <Star
                                        size={40}
                                        className={`transition-colors ${star <= (hovered || rating)
                                                ? "fill-yellow-400 text-yellow-400"
                                                : "text-gray-200"
                                            }`}
                                    />
                                </button>
                            ))}
                        </div>

                        {rating > 0 && (
                            <p className="text-center text-sm font-bold text-gray-500">
                                {["", "Poor", "Fair", "Good", "Great", "Excellent!"][rating]}
                            </p>
                        )}

                        {/* Quick tags */}
                        <div className="space-y-3">
                            <p className="text-sm font-bold text-gray-500 uppercase tracking-wide">Quick compliments</p>
                            <div className="flex flex-wrap gap-2">
                                {QUICK_COMPLIMENTS.map((tag) => (
                                    <button
                                        key={tag}
                                        onClick={() => toggleTag(tag)}
                                        className={`px-4 py-2 rounded-full text-sm font-bold border transition-all ${tags.includes(tag)
                                                ? "bg-black text-white border-black"
                                                : "bg-white text-gray-700 border-gray-200 hover:border-gray-400"
                                            }`}
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Comment */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm font-bold text-gray-500 uppercase tracking-wide">
                                <MessageSquare size={14} />
                                <span>Additional feedback (optional)</span>
                            </div>
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Tell us more about your experience..."
                                rows={3}
                                className="w-full p-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
                            />
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={submitting || rating === 0}
                            className="w-full bg-black text-white py-5 rounded-2xl font-bold text-lg hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting ? "Submitting..." : "Submit Rating"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
