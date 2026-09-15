import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, ArrowLeft, Check, Clock3, Link2, Send } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { dateTime, money } from "@/lib/utils";
import { StatusBadge } from "@/components/status-badge";
import { LiveRefresh } from "@/components/live-refresh";

const stages = ["REQUESTED", "GENERATED", "ACCESSED", "CONVERTED"] as const;
function stageIndex(status: string) {
  if (status === "EXPIRED" || status === "REVOKED") return -1;
  return stages.indexOf(status as typeof stages[number]);
}

export default async function LinkDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const link = await prisma.accessLink.findUnique({
    where: { id },
    include: { customer: true, order: { include: { items: { include: { product: true } }, utm: true } } },
  });
  if (!link) notFound();
  const progress = stageIndex(link.status);
  const metadata = link.metadata ?? link.order.rawPayload;

  return <div className="space-y-6"><LiveRefresh />
    <div className="flex flex-wrap items-start justify-between gap-4"><div><Link href="/links" className="inline-flex items-center gap-2 text-sm font-semibold text-[#b5bdca] transition hover:text-[#87f0bf]"><ArrowLeft size={16} />Voltar para entregas</Link><p className="mt-5 text-sm font-semibold text-[#87f0bf]">Entrega da venda</p><h1 className="mt-1 text-3xl font-bold tracking-tight">{link.customer.name}</h1><p className="mt-1 text-sm muted">Pedido {link.order.externalOrderId} · recebido em {dateTime(link.requestedAt)}</p></div><StatusBadge status={link.status} /></div>

    <section className="panel overflow-hidden"><div className="border-b border-[#252a35] px-5 py-4"><h2 className="font-bold">Linha da entrega</h2><p className="mt-1 text-sm muted">O Hub atualiza este histórico automaticamente quando o n8n responde.</p></div><div className="grid divide-y divide-[#252a35] md:grid-cols-4 md:divide-x md:divide-y-0">{stages.map((stage,index)=>{const complete=progress>=index;const active=progress===index;const label=stage==="REQUESTED"?"Venda recebida":stage==="GENERATED"?"Link enviado":stage==="ACCESSED"?"Link aberto":"Compra concluída";const time=stage==="REQUESTED"?link.requestedAt:stage==="GENERATED"?link.generatedAt:stage==="ACCESSED"?link.lastAccessedAt:link.status==="CONVERTED"?link.lastAccessedAt:null;return <div key={stage} className={`p-4 ${active?"bg-[#10261d]":""}`}><div className="flex items-center gap-2"><span className={`grid h-6 w-6 place-items-center rounded-full text-xs font-bold ${complete?"bg-[#87f0bf] text-[#082017]":"bg-[#242b37] text-[#8994a5]"}`}>{complete?<Check size={14}/>:index+1}</span><p className="text-sm font-semibold">{label}</p></div><p className="mt-3 text-xs muted">{time?dateTime(time):complete?"Confirmado":"Aguardando"}</p></div>})}</div></section>

    <div className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]"><section className="panel p-5"><div className="flex items-center gap-2"><Link2 size={18} className="text-[#87f0bf]"/><h2 className="font-bold">Link de acesso</h2></div>{link.url?<><a className="mt-4 flex items-center gap-2 break-all rounded-lg bg-[#171d27] p-3 text-sm font-medium text-[#87f0bf] hover:bg-[#1d2532]" href={link.url} target="_blank" rel="noreferrer"><ExternalLink size={16}/>{link.url}</a><p className="mt-3 text-xs muted">Gerado em {dateTime(link.generatedAt)}</p></>:<div className="mt-4 rounded-lg bg-[#2c2514] p-4"><div className="flex items-center gap-2 text-sm font-semibold text-[#ffd46b]"><Clock3 size={16}/>Aguardando retorno do n8n</div><p className="mt-2 text-sm text-[#c5b893]">A venda já está registrada. Assim que o fluxo enviar o link ao Telegram e chamar o Hub, a URL aparecerá aqui.</p></div>}</section>
      <section className="panel p-5"><div className="flex items-center gap-2"><Send size={18} className="text-[#8cc4ff]"/><h2 className="font-bold">Cliente e compra</h2></div><dl className="mt-4 space-y-3 text-sm"><div className="flex justify-between gap-4"><dt className="muted">E-mail</dt><dd className="text-right font-medium">{link.customer.email}</dd></div><div className="flex justify-between gap-4"><dt className="muted">Itens</dt><dd className="text-right font-medium">{link.order.items.map(item=>item.product.name).join(", ") || "Não informado"}</dd></div><div className="flex justify-between gap-4"><dt className="muted">Valor</dt><dd className="font-medium">{money(link.order.amountCents)}</dd></div><div className="flex justify-between gap-4"><dt className="muted">Canal</dt><dd className="capitalize font-medium">{link.order.source}</dd></div></dl></section></div>

    <section className="panel p-5"><h2 className="font-bold">Atribuição e metadados</h2><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><div><p className="text-xs muted">Fonte</p><p className="mt-1 text-sm font-medium">{link.order.utm?.utmSource ?? "—"}</p></div><div><p className="text-xs muted">Campanha</p><p className="mt-1 break-words text-sm font-medium">{link.order.utm?.utmCampaign ?? "—"}</p></div><div><p className="text-xs muted">Conteúdo</p><p className="mt-1 break-words text-sm font-medium">{link.order.utm?.utmContent ?? "—"}</p></div><div><p className="text-xs muted">SCK</p><p className="mt-1 break-all text-sm font-medium">{link.order.utm?.sck ?? "—"}</p></div></div><details className="mt-5 rounded-lg bg-[#0d1016] p-4"><summary className="cursor-pointer text-sm font-semibold text-[#b5bdca]">Ver metadados técnicos recebidos</summary><pre className="mt-4 max-h-96 overflow-auto whitespace-pre-wrap break-words text-xs leading-6 text-[#b6c0d0]">{JSON.stringify(metadata, null, 2)}</pre></details></section>
  </div>;
}
