"use client";

import { signIn } from "next-auth/react";
import { FormEvent, useState } from "react";

export function LoginForm({ initialError = false }: { initialError?: boolean }) {
  const [error, setError] = useState(initialError);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(false);
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const result = await signIn("credentials", {
      redirect: false,
      email: form.get("email"),
      password: form.get("password"),
    });
    if (result?.error) {
      setError(true);
      setLoading(false);
      return;
    }
    window.location.assign("/");
  }

  return <form onSubmit={handleSubmit} className="space-y-4">
    {error && <p className="rounded-lg bg-[#49202a] p-3 text-sm text-[#ffb0ba]">Credenciais inválidas</p>}
    <label className="block text-sm font-medium">E-mail<input className="input mt-1.5" type="email" name="email" required autoComplete="email"/></label>
    <label className="block text-sm font-medium">Senha<input className="input mt-1.5" type="password" name="password" required autoComplete="current-password"/></label>
    <button className="btn btn-primary mt-2 w-full" type="submit" disabled={loading}>{loading ? "Entrando..." : "Entrar"}</button>
  </form>;
}
