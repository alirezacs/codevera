"use client";

import { ThemeToggleButton } from "@/components/common/ThemeToggleButton";
import UserDropdown from "@/components/header/UserDropdown";
import { useSidebar } from "@/context/SidebarContext";
import { useTranslations } from "next-intl";

export default function AppHeader() {
  const { isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();
  const t = useTranslations("header");
  const toggle = () => window.innerWidth >= 1280 ? toggleSidebar() : toggleMobileSidebar();
  return <header className="sticky top-0 z-99999 flex w-full border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"><div className="flex w-full items-center justify-between px-3 py-3 xl:px-6 xl:py-4"><button onClick={toggle} aria-label={t("toggleSidebar")} className={`flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-500 dark:border-gray-800 dark:text-gray-400 ${isMobileOpen ? "bg-gray-100 dark:bg-white/3" : ""}`}><span className="text-xl leading-none">☰</span></button><div className="flex items-center gap-3"><ThemeToggleButton /><UserDropdown /></div></div></header>;
}
