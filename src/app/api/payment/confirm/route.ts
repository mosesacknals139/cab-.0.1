import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createServerSupabaseClient, formatSupabaseError } from "@/lib/supabase-server";
import { createHmac } from "crypto";

export async function POST(req: Request) {
    const { userId } = await auth();

    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { rideId, paymentId, orderId, signature } = await req.json();

        if (!rideId) {
            return NextResponse.json({ error: "Missing ride ID." }, { status: 400 });
        }

        const supabase = createServerSupabaseClient();
        const { data: ride, error: rideError } = await supabase
            .from("rides")
            .select("id, rider_id, status, payment_status, payment_intent_id")
            .eq("id", rideId)
            .eq("rider_id", userId)
            .maybeSingle();

        if (rideError) throw rideError;

        if (!ride) {
            return NextResponse.json({ error: "Ride not found." }, { status: 404 });
        }

        if (ride.status !== "completed") {
            return NextResponse.json(
                { error: "Payment confirmation is allowed only for completed rides." },
                { status: 409 }
            );
        }

        if (ride.payment_status === "paid") {
            return NextResponse.json({ success: true, rideId: ride.id, payment_status: "paid" });
        }

        const razorpaySecret = process.env.RAZORPAY_KEY_SECRET;
        if (razorpaySecret) {
            if (!paymentId || !orderId || !signature) {
                return NextResponse.json(
                    { error: "Missing payment verification fields." },
                    { status: 400 }
                );
            }

            const expectedSignature = createHmac("sha256", razorpaySecret)
                .update(`${orderId}|${paymentId}`)
                .digest("hex");

            if (expectedSignature !== signature) {
                return NextResponse.json(
                    { error: "Invalid payment signature." },
                    { status: 400 }
                );
            }
        }

        const paymentIntentId = paymentId || orderId || ride.payment_intent_id || null;

        const { data: updatedRide, error: updateError } = await supabase
            .from("rides")
            .update({
                payment_status: "paid",
                payment_intent_id: paymentIntentId,
            })
            .eq("id", rideId)
            .eq("rider_id", userId)
            .select("id, payment_status, payment_intent_id")
            .single();

        if (updateError) throw updateError;

        return NextResponse.json({ success: true, ride: updatedRide });
    } catch (error) {
        return NextResponse.json(
            {
                error: formatSupabaseError(error as { code?: string | null; message?: string | null }, "rides"),
            },
            { status: 500 }
        );
    }
}