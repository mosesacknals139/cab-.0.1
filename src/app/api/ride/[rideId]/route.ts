import { auth } from "@clerk/nextjs/server";
import { createServerSupabaseClient, formatSupabaseError } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

type RouteContext = {
    params: Promise<{
        rideId: string;
    }>;
};

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
