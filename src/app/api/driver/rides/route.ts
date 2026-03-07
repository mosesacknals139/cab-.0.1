import { auth, currentUser } from "@clerk/nextjs/server";
import {
    createServerSupabaseClient,
    formatSupabaseError,
    isSupabaseSetupError,
} from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function GET() {
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const supabase = createServerSupabaseClient();

        const { error: profileError } = await supabase
            .from("profiles")
            .upsert({
                id: userId,
                full_name: [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username || "Uber Clone Driver",
                email: user.emailAddresses[0]?.emailAddress || null,
                avatar_url: user.imageUrl,
                role: "driver",
            }, {
                onConflict: "id",
            });

        if (profileError) throw profileError;

        const startOfTodayUtc = new Date();
        startOfTodayUtc.setUTCHours(0, 0, 0, 0);

        const [
            { data: requests, error: requestsError },
            { data: activeRide, error: activeRideError },
            { data: driverRides, error: driverRidesError },
            { data: todaysCompletedRides, error: todaysCompletedRidesError },
            { data: recentCompletedRides, error: recentCompletedRidesError },
        ] = await Promise.all([
            supabase
                .from("rides")
                .select("*")
                .eq("status", "requested")
                .is("driver_id", null)
                .order("created_at", { ascending: false }),
            supabase
                .from("rides")
                .select("*")
                .eq("driver_id", userId)
                .in("status", ["accepted", "ongoing"])
                .order("created_at", { ascending: false })
                .limit(1)
                .maybeSingle(),
            supabase
                .from("rides")
                .select("status")
                .eq("driver_id", userId),
            supabase
                .from("rides")
                .select("fare, payment_status")
                .eq("driver_id", userId)
                .eq("status", "completed")
                .gte("created_at", startOfTodayUtc.toISOString()),
            supabase
                .from("rides")
                .select("id, fare, payment_status, created_at, pickup_location, dropoff_location")
                .eq("driver_id", userId)
                .eq("status", "completed")
                .order("created_at", { ascending: false })
                .limit(10),
        ]);

        if (requestsError) throw requestsError;
        if (activeRideError) throw activeRideError;
        if (driverRidesError) throw driverRidesError;
        if (todaysCompletedRidesError) throw todaysCompletedRidesError;
        if (recentCompletedRidesError) throw recentCompletedRidesError;

        const totalAssigned = driverRides?.length || 0;
        const completedTrips = driverRides?.filter((ride) => ride.status === "completed").length || 0;
        const nonCancelledTrips = driverRides?.filter((ride) => ride.status !== "cancelled").length || 0;
        const acceptanceRate = totalAssigned > 0 ? Math.round((nonCancelledTrips / totalAssigned) * 100) : 0;
        const todayEarnings =
            todaysCompletedRides
                ?.filter((ride) => ride.payment_status === "paid")
                .reduce((sum, ride) => sum + (Number(ride.fare) || 0), 0) || 0;
        const todayPendingPayout =
            todaysCompletedRides
                ?.filter((ride) => ride.payment_status !== "paid")
                .reduce((sum, ride) => sum + (Number(ride.fare) || 0), 0) || 0;

        return NextResponse.json({
            requests: requests || [],
            activeRide: activeRide || null,
            recentEarnings: recentCompletedRides || [],
            stats: {
                completedTrips,
                acceptanceRate,
                todayEarnings,
                todayPendingPayout,
            },
        });
    } catch (error) {
        if (isSupabaseSetupError(error as { code?: string | null; message?: string | null })) {
            return NextResponse.json({
                requests: [],
                activeRide: null,
                recentEarnings: [],
                stats: {
                    completedTrips: 0,
                    acceptanceRate: 0,
                    todayEarnings: 0,
                    todayPendingPayout: 0,
                },
                setupRequired: true,
                error: formatSupabaseError(error as { code?: string | null; message?: string | null }, "rides"),
            });
        }

        return NextResponse.json(
            {
                error: formatSupabaseError(error as { code?: string | null; message?: string | null }, "rides"),
            },
            { status: 500 }
        );
    }
}
