export type DemoRideStatus = "requested" | "accepted" | "ongoing" | "completed" | "cancelled";

export interface DemoRideRating {
  rating: number;
  comment: string | null;
  tags: string[] | null;
  created_at: string;
}

export interface DemoRide {
  id: string;
  rider_id: string;
  driver_id: string | null;
  pickup_location: string;
  dropoff_location: string;
  pickup_lat: number;
  pickup_lng: number;
  dropoff_lat: number;
  dropoff_lng: number;
  fare: number;
  status: DemoRideStatus;
  created_at: string;
  payment_status?: "pending" | "paid" | "refunded";
  demo_mode?: boolean;
  rating?: DemoRideRating | null;
}

const DEMO_RIDES_KEY = "cab_demo_rides";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function parseDemoRides(value: string | null): DemoRide[] {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value) as DemoRide[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistDemoRides(rides: DemoRide[]) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(DEMO_RIDES_KEY, JSON.stringify(rides));
}

export function getDemoRides(): DemoRide[] {
  if (!canUseStorage()) return [];
  return parseDemoRides(window.localStorage.getItem(DEMO_RIDES_KEY));
}

export function getDemoRidesForUser(userId: string) {
  return getDemoRides()
    .filter((ride) => ride.rider_id === userId)
    .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
}

export function getDemoRideById(rideId: string) {
  return getDemoRides().find((ride) => ride.id === rideId) || null;
}

export function upsertDemoRide(nextRide: DemoRide) {
  const rides = getDemoRides();
  const nextRides = rides.some((ride) => ride.id === nextRide.id)
    ? rides.map((ride) => (ride.id === nextRide.id ? { ...ride, ...nextRide } : ride))
    : [nextRide, ...rides];

  persistDemoRides(nextRides);
  return nextRide;
}

export function updateDemoRide(rideId: string, patch: Partial<DemoRide>) {
  const rides = getDemoRides();
  const nextRides = rides.map((ride) =>
    ride.id === rideId ? { ...ride, ...patch } : ride
  );

  persistDemoRides(nextRides);
  return nextRides.find((ride) => ride.id === rideId) || null;
}

export function saveDemoRideRating(rideId: string, rating: DemoRideRating) {
  return updateDemoRide(rideId, { rating });
}
