import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
export default async function DashboardLayout({ children }: { children: React.ReactNode }) { const session = await auth(); if (!session?.user) redirect("/login"); return <><Sidebar role={session.user.role}/><main className="min-h-screen md:ml-64"><Topbar/><div className="mx-auto max-w-[1600px] p-5 md:p-8">{children}</div></main></>; }
