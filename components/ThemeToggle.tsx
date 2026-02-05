"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  // On mount, check localStorage or system preference
  useEffect(() => {
    setMounted(true);
    // const stored = localStorage.getItem("theme");
    // if (stored === "dark") {
    //   setIsDark(true);
    //   document.documentElement.classList.add("dark");
    //   document.documentElement.setAttribute("data-mantine-color-scheme", "dark");
    // } else if (stored === "light") {
    //   setIsDark(false);
    //   document.documentElement.classList.remove("dark");
    //   document.documentElement.setAttribute("data-mantine-color-scheme", "light");
    // } else {
    //   // Check system preference
    //   const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    //   setIsDark(prefersDark);
    //   if (prefersDark) {
    //     document.documentElement.classList.add("dark");
    //     document.documentElement.setAttribute("data-mantine-color-scheme", "dark");
    //   } else {
    //     document.documentElement.classList.remove("dark");
    //     document.documentElement.setAttribute("data-mantine-color-scheme", "light");
    //   }
    // }
  }, []);

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    if (newIsDark) {
      document.documentElement.classList.add("dark");
      document.documentElement.setAttribute("data-mantine-color-scheme", "dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.setAttribute("data-mantine-color-scheme", "light");
      localStorage.setItem("theme", "light");
    }
  };

  // Avoid hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <button className="theme-toggle" aria-label="Toggle theme">
        <Sun size={20} />
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className="theme-toggle"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
}
