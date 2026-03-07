import Razorpay from "razorpay";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createServerSupabaseClient, formatSupabaseError } from "@/lib/supabase-server";

function createRazorpayClient() {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
        return null;
    }

    return new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
    });
}

function createReceiptId(rideId: string) {
    const compactRideId = rideId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 30);
    return `rcpt_${compactRideId}`;
}

export async function POST(req: Request) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { rideId } = await req.json();

        if (!rideId) {
            return NextResponse.json(
                { error: "Missing ride ID." },
                { status: 400 }
            );
        }

        const supabase = createServerSupabaseClient();
        const { data: ride, error: rideError } = await supabase
            .from("rides")
            .select("id, rider_id, fare, status, payment_status")
            .eq("id", rideId)
            .eq("rider_id", userId)
            .maybeSingle();

        if (rideError) throw rideError;

        if (!ride) {
            return NextResponse.json({ error: "Ride not found." }, { status: 404 });
        }

        if (ride.status !== "completed") {
            return NextResponse.json(
                { error: "Payment is available only after ride completion." },
                { status: 409 }
            );
        }

        if (ride.payment_status === "paid") {
            return NextResponse.json(
                { error: "This ride is already paid." },
                { status: 409 }
            );
        }

        const amount = Number(ride.fare);
        if (!Number.isFinite(amount) || amount <= 0) {
            return NextResponse.json(
                { error: "Invalid ride fare for payment." },
                { status: 400 }
            );
        }

        const razorpay = createRazorpayClient();

        if (!razorpay) {
            return NextResponse.json(
                { error: "Razorpay server keys are missing." },
                { status: 500 }
            );
        }

        // Create an order in Razorpay
        const options = {
            amount: Math.round(amount * 100), // Amount in smallest currency unit (paise for INR)
            currency: "INR",
            receipt: createReceiptId(rideId),
            notes: {
                rideId,
                userId,
            },
        };

        const order = await razorpay.orders.create(options);

        const { error: updateRideError } = await supabase
            .from("rides")
            .update({ payment_intent_id: order.id })
            .eq("id", rideId)
            .eq("rider_id", userId);

        if (updateRideError) throw updateRideError;

        return NextResponse.json({
            id: order.id,
            amount: order.amount,
            currency: order.currency
        });
    } catch (error) {
        console.error("Razorpay error:", error);
        if (
            typeof error === "object" &&
            error !== null &&
            ("code" in error || "message" in error)
        ) {
            return NextResponse.json(
                {
                    error: formatSupabaseError(
                        error as { code?: string | null; message?: string | null },
                        "rides"
                    ),
                },
                { status: 500 }
            );
        }

        const message =
            typeof error === "object" &&
            error !== null &&
            "error" in error &&
            typeof (error as { error?: { description?: string } }).error?.description === "string"
                ? (error as { error: { description: string } }).error.description
                : "Failed to create Razorpay order";

        return NextResponse.json({ error: message }, { status: 500 });
    }
}
