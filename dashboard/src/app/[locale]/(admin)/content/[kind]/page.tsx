import ContentManager from "@/components/dashboard/ContentManager";
import { notFound } from "next/navigation";
export default async function ContentPage({ params }: { params: Promise<{ kind: string }> }) { const {kind} = await params; if (!["projects","tools","founders"].includes(kind)) notFound(); return <ContentManager kind={kind as "projects" | "tools" | "founders"} />; }
