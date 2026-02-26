import { auth, currentUser } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase-client";
import { NextResponse } from "next/server";

export async function POST() {
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const { data, error } = await supabase
            .from("profiles")
            .upsert({
                id: userId,
                full_name: `${user.firstName} ${user.lastName}`,
                email: user.emailAddresses[0].emailAddress,
                avatar_url: user.imageUrl,
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error) {
        console.error("Error syncing user:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
