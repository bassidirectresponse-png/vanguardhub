import Link from "next/link";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { dateTime } from "@/lib/utils";
import { StatusBadge } from "@/components/status-badge";
import { LiveRefresh } from "@/components/live-refresh";

const tabs = ["Todas", "Renovadas", "Recusadas", "Atrasadas", "Canceladas", "Ativas"];
const eventForTab: Record<string, "RENEWED" | "REFUSED" | "LATE" | "CANCELED"> = { Renovadas:"RENEWED", Recusadas:"REFUSED", Atrasadas:"LATE", Canceladas:"CANCELED" };
const statusForTab: Record<string, "ACTIVE"> = { Ativas:"ACTIVE" };
function dayBounds(day?: string) { if (!day) return undefined; return { gte:new Date(`${day}T00:00:00-03:00`), lte:new Date(`${day}T23:59:59.999-03:00`) }; }

export default async function SubscriptionsPage({ searchParams }: { searchParams: Promise<{ tab?:string; day?:string }> }) {
  const { tab="Todas", day } = await searchParams;
  const occurredAt = dayBounds(day);
  const where: Prisma.SubscriptionWhereInput = eventForTab[tab] ? { events:{ some:{ type:eventForTab[tab], ...(occurredAt?{occurredAt}:{}) } } } : statusForTab[tab] ? { status:statusForTab[tab] } : {};
  const subscriptions = await prisma.subscription.findMany({ where, include:{ customer:true, product:true, events:{ orderBy:{occurredAt:"desc"}, take:3 } }, orderBy:{ updatedAt:"desc" }, take:100 });
  return <div className="space-y-6"><LiveRefresh/>
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-semibold text-[#87f0bf]">VendePay · assinatura</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Ciclos e tentativas</h1><p className="mt-1 text-sm text-[#9099aa]">Renovações, recusas e cancelamentos com data, cliente e tentativa mais recente.</p></div><div className="flex items-center gap-2 text-xs text-[#9aa4b4]"><span className="h-2 w-2 rounded-full bg-[#87f0bf]" aria-hidden/>Atualização automática</div></div>
    <form className="flex flex-wrap items-center gap-2" action="/assinaturas"><input type="hidden" name="tab" value={tab}/><label className="text-sm text-[#b5bdca]" htmlFor="subscription-day">Dia</label><input id="subscription-day" name="day" type="date" defaultValue={day} className="input h-10 w-auto"/><button className="btn btn-secondary" type="submit">Filtrar</button>{day&&<Link className="btn btn-secondary" href={`/assinaturas?tab=${tab}`}>Limpar data</Link>}</form>
    <div className="flex gap-2 overflow-x-auto pb-1">{tabs.map(item=><Link key={item} href={`/assinaturas?tab=${item}${day?`&day=${day}`:""}`} className={`whitespace-nowrap rounded-full px-3 py-2 text-sm font-semibold ${tab===item?"bg-[#87f0bf] text-[#082017]":"bg-[#1a202a] text-[#b5bdca] hover:bg-[#222936]"}`}>{item}</Link>)}</div>
    <div className="panel table-wrap"><table><thead><tr><th>Cliente</th><th>Plano</th><th>Estado atual</th><th>Último evento</th><th>Quando ocorreu</th><th>Tentativa / ciclo</th></tr></thead><tbody>{subscriptions.map(s=>{const latest=s.events[0];return <tr key={s.id}><td><Link href={`/assinaturas/${s.id}`} className="font-semibold hover:text-[#87f0bf]">{s.customer.name}</Link><span className="block text-xs muted">{s.customer.email}</span></td><td>{s.planName??s.product?.name??"—"}</td><td><StatusBadge status={s.status}/></td><td>{latest?<StatusBadge status={latest.type}/>:"—"}</td><td>{latest?dateTime(latest.occurredAt):"—"}</td><td>{s.renewalCount} renovações · {s.cycleCount} ciclos</td></tr>})}{!subscriptions.length&&<tr><td colSpan={6} className="py-12 text-center muted">Nenhuma assinatura para este filtro.</td></tr>}</tbody></table></div>
  </div>;
}
