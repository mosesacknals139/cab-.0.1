import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)", "/", "/api/public(.*)"]);
const isRideRequest = createRouteMatcher(["/api/ride(.*)"]);

// Simple in-memory rate limit store (for demonstration - in production use Redis/Upstash)
const rateLimit = new Map<string, { count: number; lastReset: number }>();
const LIMIT = 5; // 5 requests
const WINDOW = 60 * 1000; // per minute

export default clerkMiddleware(async (auth, request) => {
    if (!isPublicRoute(request)) {
        const { userId } = await auth();

        // Rate limiting for ride requests
        if (isRideRequest(request) && userId) {
            const now = Date.now();
            const userLimit = rateLimit.get(userId) || { count: 0, lastReset: now };

            if (now - userLimit.lastReset > WINDOW) {
                userLimit.count = 0;
                userLimit.lastReset = now;
            }

            userLimit.count++;
            rateLimit.set(userId, userLimit);

            if (userLimit.count > LIMIT) {
                return new NextResponse("Too Many Requests", { status: 429 });
            }
        }

        await auth.protect();
    }
});

export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|musjs)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
};
