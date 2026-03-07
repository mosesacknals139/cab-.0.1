"use client";

import { UserButton, SignInButton, SignUpButton, SignedIn, SignedOut } from "@clerk/nextjs";
import Link from "next/link";
import { MapPin, Shield, Clock, Star, ChevronRight, Zap } from "lucide-react";
import { motion, useAnimation, useMotionValue, useTransform, animate } from "framer-motion";
import type { Variants } from "framer-motion";
import { useEffect, useRef, useState } from "react";

/* ─────────────────────────────────────────────────────────────
   CANVAS – live rain / particle background
───────────────────────────────────────────────────────────── */
function RainCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let animId: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const drops: { x: number; y: number; speed: number; len: number; opacity: number }[] = [];
    for (let i = 0; i < 120; i++) {
      drops.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        speed: 4 + Math.random() * 6,
        len: 18 + Math.random() * 22,
        opacity: 0.08 + Math.random() * 0.18,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drops.forEach((d) => {
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - 1, d.y + d.len);
        ctx.strokeStyle = `rgba(100,160,255,${d.opacity})`;
        ctx.lineWidth = 1;
        ctx.stroke();
        d.y += d.speed;
        if (d.y > canvas.height) {
          d.y = -d.len;
          d.x = Math.random() * canvas.width;
        }
      });
      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-0"
      style={{ opacity: 0.6 }}
    />
  );
}

/* ─────────────────────────────────────────────────────────────
   SVG CAR – reusable inline SVG car body
───────────────────────────────────────────────────────────── */
function CarSVG({ color = "#4f8ef7", scale = 1 }: { color?: string; scale?: number }) {
  return (
    <svg
      width={140 * scale}
      height={60 * scale}
      viewBox="0 0 140 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Body */}
      <rect x="10" y="28" width="120" height="22" rx="6" fill={color} />
      {/* Cabin */}
      <path d="M35 28 L48 10 H92 L105 28 Z" fill={color} />
      {/* Windows */}
      <path d="M50 12 L48 26 H70 V12 Z" fill="#1a2a4a" opacity="0.8" />
      <path d="M72 12 V26 H92 L90 12 Z" fill="#1a2a4a" opacity="0.8" />
      {/* Wheels */}
      <circle cx="35" cy="50" r="10" fill="#1a1a2e" />
      <circle cx="35" cy="50" r="5" fill="#374151" />
      <circle cx="105" cy="50" r="10" fill="#1a1a2e" />
      <circle cx="105" cy="50" r="5" fill="#374151" />
      {/* Headlight glow */}
      <ellipse cx="130" cy="36" rx="6" ry="4" fill="#ffd700" opacity="0.9" />
      <ellipse cx="10" cy="36" rx="4" ry="3" fill="#ff6b6b" opacity="0.7" />
      {/* Stripe */}
      <rect x="10" y="35" width="120" height="3" rx="1" fill="white" opacity="0.15" />
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────
   ROAD SCENE – cars driving on road with headlights
───────────────────────────────────────────────────────────── */
function RoadScene() {
  const cars = [
    { color: "#4f8ef7", delay: 0, duration: 9, y: 72, scale: 1 },
    { color: "#f7994f", delay: 3, duration: 12, y: 58, scale: 0.75 },
    { color: "#4ff7c8", delay: 6, duration: 8, y: 80, scale: 0.85 },
    { color: "#f74f7b", delay: 1.5, duration: 14, y: 65, scale: 0.65 },
  ];

  return (
    <div className="relative w-full h-44 overflow-hidden" style={{ marginTop: "auto" }}>
      {/* Road surface */}
      <div
        className="absolute bottom-0 w-full"
        style={{
          height: "88px",
          background: "linear-gradient(180deg, #111827 0%, #1f2937 100%)",
          boxShadow: "inset 0 4px 24px rgba(0,0,0,0.6)",
        }}
      />
      {/* Road lines */}
      <div className="absolute bottom-0 w-full" style={{ height: "88px" }}>
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{
              bottom: "40px",
              left: `${i * 12}%`,
              width: "8%",
              height: "4px",
              background: "rgba(255,220,50,0.6)",
              borderRadius: "2px",
            }}
            animate={{ x: [0, "-120%"] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "linear", delay: i * 0.18 }}
          />
        ))}
      </div>
      {/* Moving cars */}
      {cars.map((car, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{ bottom: `${car.y - 60}px`, filter: "drop-shadow(0 0 12px rgba(79,142,247,0.5))" }}
          initial={{ x: "110vw" }}
          animate={{ x: "-20vw" }}
          transition={{
            duration: car.duration,
            repeat: Infinity,
            ease: "linear",
            delay: car.delay,
          }}
        >
          <CarSVG color={car.color} scale={car.scale} />
          {/* Headlight glow on road */}
          <div
            className="absolute"
            style={{
              left: `${135 * car.scale - 20}px`,
              top: `${28 * car.scale}px`,
              width: "80px",
              height: "20px",
              background: "radial-gradient(ellipse, rgba(255,215,0,0.35) 0%, transparent 70%)",
              transform: "scaleX(2)",
            }}
          />
        </motion.div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   FLOATING HERO CAR – large animated car with glow
───────────────────────────────────────────────────────────── */
function HeroCar() {
  return (
    <div className="relative flex items-center justify-center h-full">
      {/* Glow ring */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 360,
          height: 360,
          background: "radial-gradient(circle, rgba(79,142,247,0.18) 0%, transparent 70%)",
        }}
        animate={{ scale: [1, 1.12, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Orbit ring */}
      <motion.div
        className="absolute rounded-full border border-blue-500/20"
        style={{ width: 420, height: 420 }}
        animate={{ rotate: 360 }}
        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
      >
        <div
          className="absolute w-3 h-3 rounded-full bg-blue-400"
          style={{ top: -6, left: "50%", transform: "translateX(-50%)" }}
        />
      </motion.div>
      {/* Second orbit */}
      <motion.div
        className="absolute rounded-full border border-cyan-500/10"
        style={{ width: 520, height: 520 }}
        animate={{ rotate: -360 }}
        transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
      >
        <div
          className="absolute w-2 h-2 rounded-full bg-cyan-400"
          style={{ top: -4, left: "50%", transform: "translateX(-50%)" }}
        />
      </motion.div>
      {/* Main car */}
      <motion.div
        animate={{ y: [0, -18, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
        style={{ filter: "drop-shadow(0 24px 48px rgba(79,142,247,0.55))" }}
      >
        <CarSVG color="#4f8ef7" scale={2.4} />
      </motion.div>
      {/* Shadow on ground */}
      <motion.div
        className="absolute rounded-full"
        style={{
          bottom: "10px",
          width: 280,
          height: 18,
          background: "radial-gradient(ellipse, rgba(79,142,247,0.25) 0%, transparent 70%)",
        }}
        animate={{ scaleX: [1, 0.82, 1], opacity: [0.6, 0.3, 0.6] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   FLOATING PARTICLES
───────────────────────────────────────────────────────────── */
function Particles() {
  const seeded = (index: number, offset: number) => {
    const raw = Math.sin(index * 12.9898 + offset * 78.233) * 43758.5453;
    return raw - Math.floor(raw);
  };

  const particles = Array.from({ length: 24 }, (_, i) => ({
    id: i,
    x: seeded(i, 1) * 100,
    y: seeded(i, 2) * 100,
    size: 2 + seeded(i, 3) * 4,
    delay: seeded(i, 4) * 4,
    dur: 4 + seeded(i, 5) * 6,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-blue-400"
          style={{
            left: `${p.x.toFixed(4)}%`,
            top: `${p.y.toFixed(4)}%`,
            width: `${p.size.toFixed(5)}px`,
            height: `${p.size.toFixed(5)}px`,
            opacity: "0.3",
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.1, 0.5, 0.1],
            scale: [1, 1.4, 1],
          }}
          transition={{
            duration: p.dur,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   ANIMATED COUNTER
───────────────────────────────────────────────────────────── */
function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const nodeRef = useRef<HTMLSpanElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold: 0.5 }
    );
    if (nodeRef.current) obs.observe(nodeRef.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!inView || !nodeRef.current) return;
    const controls = animate(0, to, {
      duration: 2,
      ease: "easeOut",
      onUpdate(v) {
        if (nodeRef.current) nodeRef.current.textContent = Math.round(v) + suffix;
      },
    });
    return () => controls.stop();
  }, [inView, to, suffix]);

  return <span ref={nodeRef}>0{suffix}</span>;
}

/* ─────────────────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────────────────── */
export default function Home() {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.3 } },
  };
  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  };

  return (
    <div className="flex flex-col min-h-screen overflow-x-hidden" style={{ background: "#050b18", color: "#e8eaf6" }}>

      {/* ── NAV ── */}
      <nav
        className="flex items-center justify-between px-4 sm:px-6 py-4 sticky top-0 z-50"
        style={{
          background: "rgba(5,11,24,0.85)",
          backdropFilter: "blur(18px)",
          borderBottom: "1px solid rgba(79,142,247,0.12)",
        }}
      >
        <div className="flex items-center gap-4 lg:gap-8 min-w-0">
          <Link href="/" className="text-2xl font-bold tracking-tighter">
            <span className="text-white">RIDE</span>
            <span style={{ color: "#4f8ef7" }}>X</span>
          </Link>
          <div className="hidden lg:flex gap-6 text-sm font-medium" style={{ color: "#94a3b8" }}>
            {[
              { label: "Ride", href: "/rides" },
              { label: "Drive", href: "/driver" },
              { label: "About", href: "#features" },
              { label: "Pricing", href: "#pricing" },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="hover:text-white transition-colors duration-200 relative group"
              >
                {item.label}
                <span
                  className="absolute -bottom-1 left-0 w-0 h-px group-hover:w-full transition-all duration-300"
                  style={{ background: "#4f8ef7" }}
                />
              </Link>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <SignedOut>
            <SignInButton mode="modal">
              <button
                className="px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200"
                style={{ color: "#94a3b8", border: "1px solid rgba(148,163,184,0.2)" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color = "#fff";
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(79,142,247,0.5)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color = "#94a3b8";
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(148,163,184,0.2)";
                }}
              >
                Log in
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button
                className="px-4 sm:px-5 py-2 text-sm font-semibold rounded-lg transition-all duration-200 whitespace-nowrap"
                style={{
                  background: "linear-gradient(135deg, #4f8ef7, #1d4ed8)",
                  color: "#fff",
                  boxShadow: "0 0 20px rgba(79,142,247,0.35)",
                }}
              >
                Sign up free
              </button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <Link
              href="/dashboard"
              className="text-sm font-medium px-4 py-2 rounded-lg transition-all"
              style={{ color: "#4f8ef7", border: "1px solid rgba(79,142,247,0.3)" }}
            >
              Dashboard
            </Link>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section
        id="ride"
        className="relative flex-grow overflow-hidden"
        style={{ minHeight: "90vh", background: "linear-gradient(135deg, #050b18 0%, #0a1628 60%, #050b18 100%)" }}
      >
        {/* Live rain canvas */}
        <RainCanvas />
        {/* Floating particles */}
        <Particles />

        {/* Grid overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(rgba(79,142,247,0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(79,142,247,0.03) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
          }}
        />

        {/* Radial glow center-left */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: "10%",
            left: "-5%",
            width: "55vw",
            height: "55vw",
            background: "radial-gradient(circle, rgba(79,142,247,0.1) 0%, transparent 70%)",
          }}
        />
        {/* Radial glow top-right */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: "-10%",
            right: "-5%",
            width: "40vw",
            height: "40vw",
            background: "radial-gradient(circle, rgba(29,78,216,0.12) 0%, transparent 70%)",
          }}
        />

        {/* Content grid */}
        <div className="relative z-10 grid lg:grid-cols-2 items-center h-full max-w-7xl mx-auto px-6 py-16" style={{ minHeight: "calc(90vh - 140px)" }}>
          {/* Left: Text */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="flex flex-col gap-6"
          >
            {/* Badge */}
            <motion.div variants={itemVariants}>
              <span
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
                style={{
                  background: "rgba(79,142,247,0.12)",
                  border: "1px solid rgba(79,142,247,0.3)",
                  color: "#4f8ef7",
                }}
              >
                <Zap size={12} />
                Now available in 50+ cities
              </span>
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="font-bold leading-tight"
              style={{ fontSize: "clamp(2.8rem, 5vw, 5rem)", letterSpacing: "-0.02em", color: "#f1f5f9" }}
            >
              Your ride,{" "}
              <span
                style={{
                  background: "linear-gradient(135deg, #4f8ef7, #60efff)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                on demand.
              </span>
              <br />
              <span style={{ fontSize: "70%", color: "#94a3b8", WebkitTextFillColor: "#94a3b8" }}>
                Instantly. Safely.
              </span>
            </motion.h1>

            <motion.p
              variants={itemVariants}
              style={{ color: "#64748b", fontSize: "1.15rem", maxWidth: "480px", lineHeight: 1.7 }}
            >
              Experience the future of urban mobility. Real-time tracking, verified drivers, and seamless payments — all in one tap.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 pt-2">
              <SignedOut>
                <SignInButton mode="modal">
                  <button
                    className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 group"
                    style={{
                      background: "linear-gradient(135deg, #4f8ef7, #1d4ed8)",
                      color: "#fff",
                      boxShadow: "0 0 32px rgba(79,142,247,0.4)",
                    }}
                  >
                    Request a Ride
                    <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <Link
                  href="/dashboard"
                  className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 group"
                  style={{
                    background: "linear-gradient(135deg, #4f8ef7, #1d4ed8)",
                    color: "#fff",
                    boxShadow: "0 0 32px rgba(79,142,247,0.4)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 0 48px rgba(79,142,247,0.65)";
                    (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 0 32px rgba(79,142,247,0.4)";
                    (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(0)";
                  }}
                >
                  Request a Ride
                  <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </SignedIn>
              <Link
                href="/driver"
                className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300"
                style={{
                  border: "1px solid rgba(79,142,247,0.3)",
                  color: "#94a3b8",
                  background: "rgba(79,142,247,0.06)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(79,142,247,0.6)";
                  (e.currentTarget as HTMLAnchorElement).style.color = "#fff";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(79,142,247,0.3)";
                  (e.currentTarget as HTMLAnchorElement).style.color = "#94a3b8";
                }}
              >
                Become a Driver
              </Link>
            </motion.div>

            {/* Trust badges */}
            <motion.div variants={itemVariants} className="flex items-center gap-6 pt-2">
              <div className="flex -space-x-2">
                {["#4f8ef7", "#f7994f", "#4ff7c8", "#f74f7b"].map((c, i) => (
                  <div
                    key={i}
                    className="w-9 h-9 rounded-full border-2 flex items-center justify-center text-xs font-bold"
                    style={{ borderColor: "#050b18", background: c, color: "#fff" }}
                  >
                    {["JD", "SK", "AM", "PL"][i]}
                  </div>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} size={12} fill="#fbbf24" color="#fbbf24" />
                  ))}
                </div>
                <p style={{ color: "#64748b", fontSize: "0.78rem" }}>4.9 · 2M+ happy riders</p>
              </div>
            </motion.div>
          </motion.div>

          {/* Right: Hero Car */}
          <motion.div
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, delay: 0.4, ease: "easeOut" }}
            className="hidden lg:flex items-center justify-center"
            style={{ minHeight: "400px" }}
          >
            <HeroCar />
          </motion.div>
        </div>

        {/* Road + moving cars at bottom of hero */}
        <div className="relative z-10">
          <RoadScene />
        </div>
      </section>

      {/* ── STATS ── */}
      <section
        className="py-16 px-6"
        style={{ background: "linear-gradient(180deg, #080f22 0%, #0d1a30 100%)", borderTop: "1px solid rgba(79,142,247,0.15)" }}
      >
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { val: 50, suffix: "+", label: "Cities" },
            { val: 2, suffix: "M+", label: "Riders" },
            { val: 98, suffix: "%", label: "On Time" },
            { val: 4.9, suffix: "★", label: "Avg Rating" },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="space-y-1"
            >
              <p
                className="text-4xl font-bold"
                style={{ background: "linear-gradient(135deg,#4f8ef7,#60efff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
              >
                <Counter to={stat.val} suffix={stat.suffix} />
              </p>
              <p style={{ color: "#64748b", fontSize: "0.9rem" }}>{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-24 px-6" style={{ background: "#0b1628" }}>
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4" style={{ color: "#f1f5f9" }}>
              Why riders choose{" "}
              <span style={{ background: "linear-gradient(135deg,#4f8ef7,#60efff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                RideX
              </span>
            </h2>
            <p style={{ color: "#64748b", maxWidth: "500px", margin: "0 auto" }}>
              Built for the modern commuter — fast, safe, and always reliable.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: MapPin,
                title: "Live GPS Tracking",
                desc: "Watch your driver approach in real-time. We use Google Maps for centimetre-accurate navigation.",
                glow: "#4f8ef7",
                gradient: "linear-gradient(135deg,rgba(79,142,247,0.12),rgba(79,142,247,0.03))",
              },
              {
                icon: Shield,
                title: "Verified & Safe",
                desc: "Every driver is background-checked, licensed, and rated. Your safety is our #1 priority.",
                glow: "#4ff7c8",
                gradient: "linear-gradient(135deg,rgba(79,247,200,0.12),rgba(79,247,200,0.03))",
              },
              {
                icon: Clock,
                title: "24 / 7 Support",
                desc: "Human support, anytime. Our team is always awake and ready to resolve any issue in minutes.",
                glow: "#f7994f",
                gradient: "linear-gradient(135deg,rgba(247,153,79,0.12),rgba(247,153,79,0.03))",
              },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
                whileHover={{ y: -6, transition: { duration: 0.3 } }}
                className="rounded-2xl p-8 space-y-4"
                style={{
                  background: feature.gradient,
                  border: `1px solid ${feature.glow}22`,
                  cursor: "default",
                }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: `${feature.glow}18`, boxShadow: `0 0 16px ${feature.glow}33` }}
                >
                  <feature.icon size={22} style={{ color: feature.glow }} />
                </div>
                <h3 className="text-xl font-bold" style={{ color: "#f1f5f9" }}>{feature.title}</h3>
                <p style={{ color: "#64748b", lineHeight: 1.7 }}>{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="pricing" className="py-24 px-6" style={{ background: "#080f22" }}>
        <div className="max-w-4xl mx-auto text-center mb-14">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-bold"
            style={{ color: "#f1f5f9" }}
          >
            How it works
          </motion.h2>
        </div>
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-10 relative">
          {/* connector line */}
          <div
            className="hidden md:block absolute top-8 left-1/6 right-1/6 h-px"
            style={{ background: "linear-gradient(90deg,transparent,#4f8ef733,transparent)" }}
          />
          {[
            { step: "01", title: "Choose your ride", desc: "Enter your destination and pick a ride type that suits you." },
            { step: "02", title: "Get matched fast", desc: "Our algorithm instantly connects you with the nearest verified driver." },
            { step: "03", title: "Arrive & pay", desc: "Reach your destination and pay seamlessly in-app. No cash needed." },
          ].map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.18, duration: 0.5 }}
              className="flex flex-col items-center text-center gap-4"
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black"
                style={{
                  background: "linear-gradient(135deg,#4f8ef7,#1d4ed8)",
                  color: "#fff",
                  boxShadow: "0 0 24px rgba(79,142,247,0.4)",
                }}
              >
                {s.step}
              </div>
              <h3 className="text-xl font-bold" style={{ color: "#f1f5f9" }}>{s.title}</h3>
              <p style={{ color: "#64748b", lineHeight: 1.7 }}>{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section
        className="py-20 px-6 text-center relative overflow-hidden"
        style={{ background: "linear-gradient(135deg,#0d1e3d,#091529)" }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at 50% 50%, rgba(79,142,247,0.15) 0%, transparent 70%)",
          }}
        />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative z-10 max-w-2xl mx-auto space-y-6"
        >
          <h2 className="text-4xl font-bold" style={{ color: "#f1f5f9" }}>
            Ready to ride smarter?
          </h2>
          <p style={{ color: "#64748b" }}>Join millions of riders who trust RideX every day.</p>
          <SignedOut>
            <SignUpButton mode="modal">
              <button
                className="inline-flex items-center gap-2 px-10 py-4 rounded-xl font-semibold text-lg text-white transition-all duration-300"
                style={{
                  background: "linear-gradient(135deg,#4f8ef7,#1d4ed8)",
                  boxShadow: "0 0 40px rgba(79,142,247,0.45)",
                }}
              >
                Get started for free <ChevronRight size={20} />
              </button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-10 py-4 rounded-xl font-semibold text-lg text-white transition-all duration-300"
              style={{
                background: "linear-gradient(135deg,#4f8ef7,#1d4ed8)",
                boxShadow: "0 0 40px rgba(79,142,247,0.45)",
              }}
            >
              Get started for free <ChevronRight size={20} />
            </Link>
          </SignedIn>
        </motion.div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-14 px-6" style={{ background: "#030812", borderTop: "1px solid rgba(79,142,247,0.1)" }}>
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-12">
          <div className="col-span-2 space-y-4">
            <h2 className="text-2xl font-bold" style={{ color: "#f1f5f9" }}>
              RIDE<span style={{ color: "#4f8ef7" }}>X</span>
            </h2>
            <p style={{ color: "#475569", maxWidth: "340px", lineHeight: 1.7 }}>
              Pioneering the future of urban mobility with cutting-edge technology. Rides that are safe, fast, and always on time.
            </p>
          </div>
          {[
            {
              title: "Product",
              links: [
                { label: "Ride", href: "/rides" },
                { label: "Drive", href: "/driver" },
                { label: "Business", href: "/dashboard" },
                { label: "Safety", href: "#features" },
              ],
            },
            {
              title: "Support",
              links: [
                { label: "Help Center", href: "#pricing" },
                { label: "Terms", href: "/sign-up" },
                { label: "Privacy", href: "/sign-up" },
                { label: "Contact", href: "/sign-in" },
              ],
            },
          ].map((col, i) => (
            <div key={i} className="space-y-4">
              <h4 className="font-bold" style={{ color: "#94a3b8" }}>{col.title}</h4>
              <ul className="space-y-2 text-sm">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="transition-colors duration-200" style={{ color: "#475569" }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "#4f8ef7")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "#475569")}
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div
          className="max-w-7xl mx-auto mt-12 pt-8 text-center text-sm"
          style={{ borderTop: "1px solid rgba(79,142,247,0.08)", color: "#334155" }}
        >
          © {new Date().getFullYear()} RideX — All rights reserved.
        </div>
      </footer>
    </div>
  );
}
