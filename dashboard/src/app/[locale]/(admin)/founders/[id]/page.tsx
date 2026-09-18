import { EntityForm } from "@/components/dashboard/ContentManager";
export default async function EditFounderPage({params}:{params:Promise<{id:string}>}){return <EntityForm kind="founders" id={(await params).id}/>}
