"use client";

import { api } from "@/lib/api";
import { useRouter } from "@/i18n/navigation";
import { ChevronDownIcon } from "@/icons";
import { useEffect, useRef, useState } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";

type User = { name: string; email: string };
export default function UserDropdown() {
  const router = useRouter(); const [open,setOpen]=useState(false); const [user,setUser]=useState<User>(); const ref=useRef<HTMLDivElement>(null);
  useEffect(()=>{api<User>("auth/me").then(setUser).catch(()=>undefined);},[]);
  useEffect(()=>{const close=(event: MouseEvent)=>{if(ref.current && !ref.current.contains(event.target as Node)) setOpen(false);}; document.addEventListener("mousedown",close); return()=>document.removeEventListener("mousedown",close);},[]);
  const logout=async()=>{await fetch("/api/auth/logout",{method:"POST"});router.replace("/signin");};
  return <div ref={ref} className="relative"><button onClick={()=>setOpen(!open)} className="flex items-center gap-2 text-gray-700 dark:text-gray-300"><span className="text-theme-sm font-medium">{user?.name ?? "Admin"}</span><ChevronDownIcon className={`size-5 transition-transform ${open ? "rotate-180" : ""}`}/></button><Dropdown isOpen={open} onClose={()=>setOpen(false)} className="absolute end-0 mt-4 flex w-56 flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-900"><span className="px-3 py-2 text-theme-xs text-gray-500 dark:text-gray-400">{user?.email}</span><button onClick={logout} className="mt-2 rounded-lg border border-gray-200 px-3 py-2 text-theme-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-white/5">Sign out</button></Dropdown></div>;
}
