import { auth } from "@clerk/nextjs/server";
import { createServerSupabaseClient, formatSupabaseError } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

const DEMO_DRIVER_ID = "demo-driver";
const DEMO_AUTO_PROGRESS_ENABLED =
    process.env.ENABLE_DEMO_AUTO_PROGRESS === "true" ||
    (process.env.ENABLE_DEMO_AUTO_PROGRESS !== "false" && process.env.NODE_ENV !== "production");

type RouteContext = {
    params: Promise<{
        rideId: string;
    }>;
};

type RideRecord = {
    id: string;
    rider_id: string;
    driver_id: string | null;
    status: "requested" | "accepted" | "ongoing" | "completed" | "cancelled";
    created_at: string;
    [key: string]: unknown;
};

async function ensureDemoDriverProfile(
    supabase: ReturnType<typeof createServerSupabaseClient>
) {
    const { error } = await supabase.from("profiles").upsert(
        {
            id: DEMO_DRIVER_ID,
            full_name: "Demo Driver",
            email: "demo-driver@uber-clone.local",
            role: "driver",
        },
        { onConflict: "id" }
    );

    if (error) {
        throw error;
    }
}

async function maybeAutoProgressRide(
    ride: RideRecord,
    userId: string,
    supabase: ReturnType<typeof createServerSupabaseClient>
) {
    if (!DEMO_AUTO_PROGRESS_ENABLED) return ride;
    if (ride.rider_id !== userId) return ride;
    if (ride.status === "cancelled" || ride.status === "completed") return ride;

    const elapsedMs = Date.now() - new Date(ride.created_at).getTime();
    if (!Number.isFinite(elapsedMs) || elapsedMs < 0) return ride;

    const elapsedSeconds = Math.floor(elapsedMs / 1000);
    let nextStatus: RideRecord["status"] | null = null;
    let nextDriverId = ride.driver_id;

    if (ride.status === "requested" && !ride.driver_id && elapsedSeconds >= 12) {
        nextStatus = "accepted";
        nextDriverId = DEMO_DRIVER_ID;
    } else if (ride.status === "accepted" && ride.driver_id === DEMO_DRIVER_ID && elapsedSeconds >= 24) {
        nextStatus = "ongoing";
    } else if (ride.status === "ongoing" && ride.driver_id === DEMO_DRIVER_ID && elapsedSeconds >= 45) {
        nextStatus = "completed";
    }

    if (!nextStatus) return ride;

    if (nextDriverId === DEMO_DRIVER_ID) {
        await ensureDemoDriverProfile(supabase);
    }

    const updatePayload: {
        status: RideRecord["status"];
        driver_id?: string | null;
        payment_status?: "pending";
    } = { status: nextStatus };

    if (nextDriverId) {
        updatePayload.driver_id = nextDriverId;
    }

    if (nextStatus === "completed") {
        updatePayload.payment_status = "pending";
    }

    const { data, error } = await supabase
        .from("rides")
        .update(updatePayload)
        .eq("id", ride.id)
        .select("*")
        .single();

    if (error) throw error;

    return data as RideRecord;
}

export async function GET(_: Request, { params }: RouteContext) {
    const { userId } = await auth();

    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { rideId } = await params;
        const supabase = createServerSupabaseClient();
        const { data, error } = await supabase
            .from("rides")
            .select("*")
            .eq("id", rideId)
            .single();

        if (error) throw error;

        if (data.rider_id !== userId && data.driver_id !== userId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const nextRide = await maybeAutoProgressRide(data as RideRecord, userId, supabase);
        return NextResponse.json(nextRide);
    } catch (error) {
        return NextResponse.json(
            {
                error: formatSupabaseError(error as { code?: string | null; message?: string | null }, "rides"),
            },
            { status: 500 }
        );
    }
}
