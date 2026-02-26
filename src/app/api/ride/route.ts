import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase-client";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const { userId } = await auth();

    if (!userId) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const body = await req.json();
        const {
            pickup_location,
            dropoff_location,
            pickup_lat,
            pickup_lng,
            dropoff_lat,
            dropoff_lng,
            fare
        } = body;

        const { data, error } = await supabase
            .from("rides")
            .insert({
                rider_id: userId,
                pickup_location,
                dropoff_location,
                pickup_lat,
                pickup_lng,
                dropoff_lat,
                dropoff_lng,
                fare,
                status: 'requested'
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error) {
        console.error("Error creating ride:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
