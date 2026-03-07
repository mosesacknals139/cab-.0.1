import Razorpay from "razorpay";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || "",
    key_secret: process.env.RAZORPAY_KEY_SECRET || "",
});

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
        const { amount, rideId } = await req.json();

        if (!amount || !rideId) {
            return NextResponse.json(
                { error: "Missing payment amount or ride ID." },
                { status: 400 }
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

        return NextResponse.json({
            id: order.id,
            amount: order.amount,
            currency: order.currency
        });
    } catch (error) {
        console.error("Razorpay error:", error);
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
