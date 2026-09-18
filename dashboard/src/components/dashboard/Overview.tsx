"use client";
import ComponentCard from "@/components/common/ComponentCard";
import { api } from "@/lib/api";
import { useEffect, useState } from "react";
const sources = [["Projects","admin/content/projects"],["Tools","admin/content/tools"],["Bookings","admin/bookings"],["Messages","admin/messages"]] as const;
export default function Overview() { const [counts,setCounts]=useState<Record<string,number>>({}); useEffect(()=>{Promise.all(sources.map(async([name,path])=>[name,(await api<{total:number}>(`${path}?page=1&limit=1`)).total] as const)).then((data)=>setCounts(Object.fromEntries(data))).catch(()=>undefined);},[]); return <><h1 className="mb-6 text-title-md font-semibold text-gray-800 dark:text-white/90">Codevera administration</h1><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{sources.map(([name])=><ComponentCard key={name} title={name}><p className="text-title-lg font-semibold text-brand-500">{counts[name] ?? "—"}</p><p className="text-theme-sm text-gray-500 dark:text-gray-400">Managed records</p></ComponentCard>)}</div></>; }
