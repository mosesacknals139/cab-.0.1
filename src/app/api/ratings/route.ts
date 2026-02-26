import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-client";

export async function GET(req: Request) {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const { searchParams } = new URL(req.url);
    const rideId = searchParams.get("rideId");

    const query = supabase
        .from("ratings")
        .select("*")
        .order("created_at", { ascending: false });

    if (rideId) {
        query.eq("ride_id", rideId);
    }

    const { data, error } = await query;
    if (error) return new NextResponse("DB error", { status: 500 });

    return NextResponse.json(data);
}

export async function POST(req: Request) {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const body = await req.json();
    const { ride_id, rating, comment, tags } = body;

    if (!ride_id || !rating) {
        return new NextResponse("Missing required fields", { status: 400 });
    }

    const { data, error } = await supabase.from("ratings").insert({
        ride_id,
        rider_id: userId,
        rating,
        comment: comment || null,
        tags: tags?.length ? tags : null,
    }).select().single();

    if (error) return new NextResponse("Failed to save rating", { status: 500 });

    return NextResponse.json(data);
}
