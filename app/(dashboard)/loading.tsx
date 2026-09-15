export default function DashboardLoading() {
  return <div className="space-y-6" aria-busy="true" aria-label="Carregando dados"><div className="h-9 w-52 animate-pulse rounded bg-[#1a202a]"/><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{Array.from({length:8},(_,i)=><div key={i} className="panel h-28 animate-pulse bg-[#151923]"/>)}</div><div className="panel h-80 animate-pulse bg-[#151923]"/></div>;
}
