"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ThemeToggle() {
    const [theme, setTheme] = useState<"light" | "dark">("light");

    useEffect(() => {
        const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
        const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
        const initialTheme = savedTheme || systemTheme;

        setTheme(initialTheme);
        document.documentElement.classList.toggle("dark", initialTheme === "dark");
        document.documentElement.setAttribute("data-theme", initialTheme);
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === "light" ? "dark" : "light";
        setTheme(newTheme);
        localStorage.setItem("theme", newTheme);
        document.documentElement.classList.toggle("dark", newTheme === "dark");
        document.documentElement.setAttribute("data-theme", newTheme);
    };

    return (
        <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-gray-100 dark:bg-zinc-800 text-gray-800 dark:text-gray-200 transition-colors hover:bg-gray-200 dark:hover:bg-zinc-700 focus:outline-none"
            aria-label="Toggle Theme"
        >
            <AnimatePresence mode="wait" initial={false}>
                {theme === "light" ? (
                    <motion.div
                        key="sun"
                        initial={{ scale: 0, rotate: -90 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: 90 }}
                        transition={{ duration: 0.2 }}
                    >
                        <Sun size={20} />
                    </motion.div>
                ) : (
                    <motion.div
                        key="moon"
                        initial={{ scale: 0, rotate: -90 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: 90 }}
                        transition={{ duration: 0.2 }}
                    >
                        <Moon size={20} />
                    </motion.div>
                )}
            </AnimatePresence>
        </button>
    );
}
