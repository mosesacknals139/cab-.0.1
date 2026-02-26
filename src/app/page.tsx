"use client";

import { UserButton, SignInButton, SignedIn, SignedOut } from "@clerk/nextjs";
import Link from "next/link";
import { Car, MapPin, Shield, Clock } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-background transition-colors duration-300">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-zinc-800 sticky top-0 bg-white/80 dark:bg-background/80 backdrop-blur-md z-50">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-2xl font-bold tracking-tighter dark:text-white">
            UBER<span className="text-blue-600">CLONE</span>
          </Link>
          <div className="hidden md:flex gap-6 text-sm font-medium text-gray-600 dark:text-zinc-400">
            <Link href="#" className="hover:text-black dark:hover:text-white transition-colors">Ride</Link>
            <Link href="#" className="hover:text-black dark:hover:text-white transition-colors">Drive</Link>
            <Link href="#" className="hover:text-black dark:hover:text-white transition-colors">About</Link>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <SignedOut>
            <SignInButton mode="modal">
              <button className="px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-lg transition-colors dark:text-zinc-200">
                Log in
              </button>
            </SignInButton>
            <Link
              href="/sign-up"
              className="bg-black dark:bg-white dark:text-black text-white px-4 py-2 text-sm font-medium rounded-lg hover:bg-gray-800 dark:hover:bg-zinc-200 transition-all border-none"
            >
              Sign up
            </Link>
          </SignedOut>
          <SignedIn>
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-sm font-medium text-blue-600 hover:underline">
                Go to Dashboard
              </Link>
              <UserButton afterSignOutUrl="/" />
            </div>
          </SignedIn>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-grow">
        <div className="grid lg:grid-cols-2 min-h-[80vh]">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="flex flex-col justify-center px-6 lg:px-20 py-16 space-y-8"
          >
            <motion.h1
              variants={itemVariants}
              className="text-5xl lg:text-7xl font-bold leading-[1.1] tracking-tight text-gray-900 dark:text-white"
            >
              Go anywhere with <br /> <span className="text-blue-600">Uber Clone</span>
            </motion.h1>
            <motion.p
              variants={itemVariants}
              className="text-xl text-gray-600 dark:text-zinc-400 max-w-lg"
            >
              The professional-grade ride-hailing app built for the modern world. Real-time tracking, seamless payments, and world-class safety.
            </motion.p>
            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-4 pt-4"
            >
              <Link
                href="/dashboard"
                className="bg-black dark:bg-white dark:text-black text-white px-8 py-4 text-center rounded-xl font-semibold hover:bg-gray-800 dark:hover:bg-zinc-200 transition-all text-lg flex items-center justify-center gap-2 shadow-xl shadow-gray-200 dark:shadow-none"
              >
                Request a ride
              </Link>
              <Link
                href="#"
                className="bg-gray-100 dark:bg-zinc-800 text-black dark:text-white px-8 py-4 text-center rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-zinc-700 transition-all text-lg flex items-center justify-center gap-2"
              >
                Drive with us
              </Link>
            </motion.div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="hidden lg:block relative bg-[url('https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white dark:from-background via-transparent to-transparent"></div>
          </motion.div>
        </div>

        {/* Features Section */}
        <section className="py-24 bg-gray-50 dark:bg-zinc-900/50 px-6">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={containerVariants}
              className="grid md:grid-cols-3 gap-12"
            >
              {[
                { icon: MapPin, title: "Real-time GPS", desc: "Track your driver in real-time with Google Maps integration for precise arrivals.", color: "bg-blue-100 text-blue-600" },
                { icon: Shield, title: "Safe & Secure", desc: "Verified drivers and end-to-end encrypted payment processing with Stripe.", color: "bg-green-100 text-green-600" },
                { icon: Clock, title: "24/7 Support", desc: "Our dedicated support team is available around the clock to assist you.", color: "bg-purple-100 text-purple-600" }
              ].map((feature, i) => (
                <motion.div key={i} variants={itemVariants} className="space-y-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${feature.color}`}>
                    <feature.icon size={24} />
                  </div>
                  <h3 className="text-xl font-bold dark:text-white">{feature.title}</h3>
                  <p className="text-gray-600 dark:text-zinc-400">{feature.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-black text-white py-16 px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-12">
          <div className="col-span-2 space-y-4">
            <h2 className="text-2xl font-bold">UBER CLONE</h2>
            <p className="text-gray-400 max-w-sm">
              Providing reliable transportation solutions globally with cutting-edge technology and a focus on user experience.
            </p>
          </div>
          <div className="space-y-4">
            <h4 className="font-bold">Product</h4>
            <ul className="text-gray-400 space-y-2 text-sm">
              <li><Link href="#" className="hover:text-white transition-colors">Ride</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Drive</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Business</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Uber Health</Link></li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="font-bold">Support</h4>
            <ul className="text-gray-400 space-y-2 text-sm">
              <li><Link href="#" className="hover:text-white transition-colors">Help Center</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Safety</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto pt-16 mt-16 border-t border-white/10 text-center text-gray-500 text-sm">
          &copy; {new Date().getFullYear()} Uber Clone Project. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
