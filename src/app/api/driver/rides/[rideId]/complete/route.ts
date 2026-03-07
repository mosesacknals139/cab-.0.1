import { auth } from "@clerk/nextjs/server";
import { createServerSupabaseClient, formatSupabaseError } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

type RouteContext = {
    params: Promise<{
        rideId: string;
    }>;
};

export async function POST(_: Request, { params }: RouteContext) {
    const { userId } = await auth();

    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { rideId } = await params;
        const supabase = createServerSupabaseClient();

        const { data, error } = await supabase
            .from("rides")
            .update({ status: "completed" })
            .eq("id", rideId)
            .eq("driver_id", userId)
            .in("status", ["accepted", "ongoing"])
            .select("*")
            .maybeSingle();

        if (error) throw error;

        if (!data) {
            return NextResponse.json(
                { error: "Ride could not be completed." },
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
