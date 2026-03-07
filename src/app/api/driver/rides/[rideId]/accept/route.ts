import { auth, currentUser } from "@clerk/nextjs/server";
import { createServerSupabaseClient, formatSupabaseError } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

type RouteContext = {
    params: Promise<{
        rideId: string;
    }>;
};

export async function POST(_: Request, { params }: RouteContext) {
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { rideId } = await params;
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

        const { data, error } = await supabase
            .from("rides")
            .update({
                status: "accepted",
                driver_id: userId,
            })
            .eq("id", rideId)
            .eq("status", "requested")
            .is("driver_id", null)
            .select("*")
            .maybeSingle();

        if (error) throw error;

        if (!data) {
            return NextResponse.json(
                { error: "This ride was already accepted by another driver." },
                { status: 409 }
            );
        }

        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json(
            {
                error: formatSupabaseError(error as { code?: string | null; message?: string | null }, "rides"),
            },
            { status: 500 }
        );
    }
}
