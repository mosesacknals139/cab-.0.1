import { auth, currentUser } from "@clerk/nextjs/server";
import { createServerSupabaseClient, formatSupabaseError, isSupabaseSetupError } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function POST() {
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const supabase = createServerSupabaseClient();
        const { data, error } = await supabase
            .from("profiles")
            .upsert({
                id: userId,
                full_name: [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username || "Uber Clone Rider",
                email: user.emailAddresses[0]?.emailAddress || null,
                avatar_url: user.imageUrl,
            }, {
                onConflict: "id",
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error) {
        if (isSupabaseSetupError(error as { code?: string | null; message?: string | null })) {
            return NextResponse.json({ ok: true, demo_mode: true });
        }

        console.error("Error syncing user:", error);
        return NextResponse.json(
            {
                error: formatSupabaseError(error as { code?: string | null; message?: string | null }, "profiles"),
            },
            { status: 500 }
        );
    }
}
