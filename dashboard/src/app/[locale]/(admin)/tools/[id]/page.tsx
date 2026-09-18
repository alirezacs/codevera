import { EntityForm } from "@/components/dashboard/ContentManager";
export default async function EditToolPage({params}:{params:Promise<{id:string}>}){return <EntityForm kind="tools" id={(await params).id}/>}
