import { formatInTimeZone } from "date-fns-tz";

export const TZ = "America/Sao_Paulo";
export const money = (cents: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
export const dateTime = (value: Date | string | null | undefined) => value ? formatInTimeZone(value, TZ, "dd MMM yyyy, HH:mm", { locale: undefined }) : "—";
export const date = (value: Date | string | null | undefined) => value ? formatInTimeZone(value, TZ, "dd/MM/yyyy") : "—";
export const digits = (value?: string | null) => value?.replace(/\D/g, "") || null;
export const maskDocument = (value?: string | null) => {
  const v = digits(value); if (!v) return "—";
  return v.length === 11 ? `***.***.***-${v.slice(-2)}` : `**.***.***/****-${v.slice(-2)}`;
};
export const statusLabel: Record<string, string> = { PENDING: "Pendente", PAID: "Paga", REFUSED: "Recusada", REFUNDED: "Reembolsada", CHARGEBACK: "Chargeback", CANCELED: "Cancelada", ACTIVE: "Ativa", RENEWED: "Renovada", LATE: "Atrasada", REQUESTED: "Aguardando N8N", GENERATED: "Link pronto", ACCESSED: "Acessou", CONVERTED: "Upsell convertido", EXPIRED: "Expirado", REVOKED: "Revogado" };
