export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    full_name: string | null
                    email: string | null
                    phone_number: string | null
                    avatar_url: string | null
                    role: 'rider' | 'driver'
                    created_at: string
                }
                Insert: {
                    id: string
                    full_name?: string | null
                    email?: string | null
                    phone_number?: string | null
                    avatar_url?: string | null
                    role?: 'rider' | 'driver'
                    created_at?: string
                }
                Update: {
                    id?: string
                    full_name?: string | null
                    email?: string | null
                    phone_number?: string | null
                    avatar_url?: string | null
                    role?: 'rider' | 'driver'
                    created_at?: string
                }
            }
            rides: {
                Row: {
                    id: string
                    rider_id: string
                    driver_id: string | null
                    pickup_location: string
                    dropoff_location: string
                    pickup_lat: number
                    pickup_lng: number
                    dropoff_lat: number
                    dropoff_lng: number
                    fare: number | null
                    status: 'requested' | 'accepted' | 'ongoing' | 'completed' | 'cancelled'
                    created_at: string
                }
                Insert: {
                    id?: string
                    rider_id: string
                    driver_id?: string | null
                    pickup_location: string
                    dropoff_location: string
                    pickup_lat: number
                    pickup_lng: number
                    dropoff_lat: number
                    dropoff_lng: number
                    fare?: number | null
                    status?: 'requested' | 'accepted' | 'ongoing' | 'completed' | 'cancelled'
                    created_at?: string
                }
                Update: {
                    id?: string
                    rider_id?: string
                    driver_id?: string | null
                    pickup_location?: string
                    dropoff_location?: string
                    pickup_lat?: number
                    pickup_lng?: number
                    dropoff_lat?: number
                    dropoff_lng?: number
                    fare?: number | null
                    status?: 'requested' | 'accepted' | 'ongoing' | 'completed' | 'cancelled'
                    created_at?: string
                }
            }
        }
    }
}
