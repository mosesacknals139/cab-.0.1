"use client";

import { useUser, UserProfile } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowLeft, User, Mail, Phone, ShieldCheck } from "lucide-react";

export default function ProfilePage() {
    const { user, isLoaded } = useUser();

    if (!isLoaded) return null;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ArrowLeft size={20} />
                    </Link>
                    <h1 className="text-xl font-bold">Profile Settings</h1>
                </div>
            </header>

            <main className="flex-grow flex items-center justify-center p-6">
                <div className="w-full max-w-4xl bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 flex flex-col md:flex-row">
                    {/* Sidebar Info */}
                    <div className="w-full md:w-[300px] bg-black text-white p-8 space-y-8">
                        <div className="flex flex-col items-center gap-4">
                            <img
                                src={user?.imageUrl}
                                alt="Profile"
                                className="w-24 h-24 rounded-full border-4 border-white/20"
                            />
                            <div className="text-center">
                                <h2 className="text-xl font-bold">{user?.fullName}</h2>
                                <p className="text-gray-400 text-sm">{user?.primaryEmailAddress?.emailAddress}</p>
                            </div>
                        </div>

                        <div className="space-y-4 pt-8 border-t border-white/10">
                            <div className="flex items-center gap-3 text-sm">
                                <ShieldCheck className="text-blue-400" size={18} />
                                <span>Verified Account</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <User className="text-blue-400" size={18} />
                                <span>Member since {new Date(user?.createdAt || Date.now()).getFullYear()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Clerk Component Area */}
                    <div className="flex-grow p-4 md:p-8 bg-white overflow-hidden">
                        <UserProfile routing="hash" />
                    </div>
                </div>
            </main>
        </div>
    );
}
