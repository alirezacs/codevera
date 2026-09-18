import { cache } from 'react';
import type { Locale } from '@/i18n';
import type { Project } from '@/data/projects';
import type { Founder } from '@/data/founders';
import type { Schedule } from '@/config/availability';
export const backendUrl = process.env.CODEVERA_API_URL || 'http://127.0.0.1:4000/api/v1';
export type Localized = Record<Locale,string>;
export type Company = { name:Localized; description:Localized; location:Localized; contactConfigured:boolean; emails:string[]; phones:string[]; addresses:{label:Localized;address:Localized;mapUrl?:string}[];socialLinks:{label:string;url:string}[] };
export type Tool = {id:string;slug:string;name:Localized;description?:Localized;website?:string};
export async function apiRead<T>(path:string):Promise<T>{const response=await fetch(`${backendUrl}${path}`,{cache:'no-store',signal:AbortSignal.timeout(10000)});if(!response.ok)throw new Error('Server content is temporarily unavailable.');return response.json() as Promise<T>;}
async function collection<T>(path:string):Promise<T[]>{const items:T[]=[];let page=1;for(;;){const result=await apiRead<{items:T[];total:number}>(`${path}${path.includes('?')?'&':'?'}page=${page}&limit=100`);items.push(...result.items);if(items.length>=result.total||!result.items.length)break;page++;}return items;}
export const getProjects=cache((locale:Locale)=>collection<Project>(`/projects?locale=${locale}`));
export const getProject=cache(async(slug:string,locale:Locale):Promise<Project|undefined>=>{const response=await fetch(`${backendUrl}/projects/${encodeURIComponent(slug)}?locale=${locale}`,{cache:'no-store',signal:AbortSignal.timeout(10000)});if(response.status===404)return undefined;if(!response.ok)throw new Error('Project could not be loaded.');return response.json();});
export const getCompany=cache(()=>apiRead<Company>('/company'));
export const getTools=cache(()=>collection<Tool>('/tools'));
export const getFounders=cache(()=>collection<Founder>('/founders'));
export const getSchedule=cache(()=>apiRead<Schedule>('/consultation-settings'));
