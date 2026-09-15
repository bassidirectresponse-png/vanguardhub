import { LoginForm } from "@/components/login-form";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return <main className="grid min-h-screen place-items-center bg-[#090b10] p-5"><section className="panel w-full max-w-md p-8 shadow-2xl"><div className="mb-8 flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#87f0bf] text-xl font-black text-[#082017]">V</span><div><h1 className="font-bold">Vanguard Hub</h1><p className="text-sm text-[#9099aa]">Operações internas</p></div></div><h2 className="mb-2 text-2xl font-bold">Entrar</h2><p className="mb-6 text-sm text-[#9099aa]">Acesse seu painel de operações.</p><LoginForm initialError={Boolean(error)}/></section></main>;
}
