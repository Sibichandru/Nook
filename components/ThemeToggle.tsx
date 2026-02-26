"use client";

import { useEffect, useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

const THEME_EVENT = "theme-change";

function getThemeSnapshot(): boolean {
  if (typeof window === "undefined") return false;

  const stored = localStorage.getItem("theme");
  if (stored === "dark") return true;
  if (stored === "light") return false;

  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function subscribeToTheme(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const handleChange = () => onStoreChange();

  window.addEventListener("storage", handleChange);
  window.addEventListener(THEME_EVENT, handleChange);
  mediaQuery.addEventListener("change", handleChange);

  return () => {
    window.removeEventListener("storage", handleChange);
    window.removeEventListener(THEME_EVENT, handleChange);
    mediaQuery.removeEventListener("change", handleChange);
  };
}

function applyThemeToDocument(isDark: boolean): void {
  if (typeof document === "undefined") return;

  document.documentElement.classList.toggle("dark", isDark);
  document.documentElement.setAttribute(
    "data-mantine-color-scheme",
    isDark ? "dark" : "light"
  );
}

export function ThemeToggle() {
  const isDark = useSyncExternalStore(
    subscribeToTheme,
    getThemeSnapshot,
    () => false
  );

  useEffect(() => {
    applyThemeToDocument(isDark);
  }, [isDark]);

  const toggleTheme = () => {
    const newIsDark = !isDark;
    localStorage.setItem("theme", newIsDark ? "dark" : "light");
    window.dispatchEvent(new Event(THEME_EVENT));
  };

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
