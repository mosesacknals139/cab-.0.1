import { auth, currentUser } from "@clerk/nextjs/server";
import { createServerSupabaseClient, formatSupabaseError } from "@/lib/supabase-server";
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

        const [{ data: requests, error: requestsError }, { data: activeRide, error: activeRideError }] = await Promise.all([
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
        ]);

        if (requestsError) throw requestsError;
        if (activeRideError) throw activeRideError;

        return NextResponse.json({
            requests: requests || [],
            activeRide: activeRide || null,
        });
    } catch (error) {
        return NextResponse.json(
            {
                error: formatSupabaseError(error as { code?: string | null; message?: string | null }, "rides"),
            },
            { status: 500 }
        );
    }
}
