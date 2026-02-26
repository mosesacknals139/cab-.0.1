import Razorpay from "razorpay";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || "",
    key_secret: process.env.RAZORPAY_KEY_SECRET || "",
});

export async function POST(req: Request) {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    try {
        const { amount, rideId } = await req.json();

        // Create an order in Razorpay
        const options = {
            amount: Math.round(amount * 100), // Amount in smallest currency unit (paise for INR)
            currency: "INR",
            receipt: `receipt_${rideId}`,
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
        return new NextResponse("Failed to create Razorpay order", { status: 500 });
    }
}
