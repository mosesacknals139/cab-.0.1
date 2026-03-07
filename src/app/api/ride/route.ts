import { auth, currentUser } from "@clerk/nextjs/server";
import { createServerSupabaseClient, formatSupabaseError, isSupabaseSetupError } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

        if (
            !pickup_location ||
            !dropoff_location ||
            pickup_lat == null ||
            pickup_lng == null ||
            dropoff_lat == null ||
            dropoff_lng == null
        ) {
            return NextResponse.json(
                { error: "Pickup and dropoff locations are required." },
                { status: 400 }
            );
        }

        const supabase = createServerSupabaseClient();

        if (user) {
            const { error: profileError } = await supabase
                .from("profiles")
                .upsert({
                    id: userId,
                    full_name: [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username || "Uber Clone Rider",
                    email: user.emailAddresses[0]?.emailAddress || null,
                    avatar_url: user.imageUrl,
                }, {
                    onConflict: "id",
                });

            if (profileError) throw profileError;
        }

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
                fare: Number(fare),
                status: 'requested'
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error) {
        if (!isSupabaseSetupError(error as { code?: string | null; message?: string | null })) {
            console.error("Error creating ride:", error);
        }

        return NextResponse.json(
            {
                error: formatSupabaseError(error as { code?: string | null; message?: string | null }, "rides"),
            },
            { status: 500 }
        );
    }
}
