import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import "./globals.css";
import { ToastContainer } from "@/components/Toast";

export const metadata: Metadata = {
  title: "Uber Clone - Real-time Ride Hailing",
  description: "A professional Uber clone with real-time tracking and Stripe payments.",
};

import ThemeToggle from "@/components/ThemeToggle";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className="antialiased">
          <div className="fixed bottom-6 left-6 z-[60]">
            <ThemeToggle />
          </div>
          {children}
          <ToastContainer />
        </body>
      </html>
    </ClerkProvider>
  );
}
