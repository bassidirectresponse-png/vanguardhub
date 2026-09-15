import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { kirvano } from "@/lib/webhooks/adapters/kirvano";
import { processCanonical } from "@/lib/webhooks/process-canonical";
import { validSecret } from "@/lib/webhooks/verify";

const schema = z.object({
  event: z.string(), orderId: z.string().optional(), customerEmail: z.string().email().optional(),
  linkUrl: z.string().url().optional(), linkLabel: z.string().optional(), token: z.string().optional(),
  n8nRunId: z.string().optional(), expiresAt: z.string().nullable().optional(), metadata: z.unknown().optional(),
});

async function findLink(orderId?: string, token?: string, email?: string) {
  if (orderId) return prisma.accessLink.findFirst({ where: { order: { externalOrderId: orderId } } });
  if (token) return prisma.accessLink.findUnique({ where: { token } });
  return email ? prisma.accessLink.findFirst({ where: { customer: { emailNormalized: email.toLowerCase().trim() } }, orderBy: { requestedAt: "desc" } }) : null;
}

function originalVendePayPayload(metadata: unknown) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return null;
  const payload = (metadata as Record<string, unknown>).originalWebhook;
  return payload && typeof payload === "object" && !Array.isArray(payload) ? payload : null;
}

export async function POST(req: NextRequest) {
  if (!validSecret(req, process.env.N8N_WEBHOOK_SECRET)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const raw = await req.json();
    const p = schema.parse(raw);
    const key = `${p.event}:${p.orderId ?? p.token ?? p.customerEmail}:${p.n8nRunId ?? ""}`;
    const host = (process.env.AUTH_URL ?? req.nextUrl.origin).replace(/\/$/, "");
    const inbox = await prisma.webhookInbox.upsert({
      where: { source_externalKey: { source: "N8N", externalKey: key } },
      create: { source: "N8N", eventType: p.event, externalKey: key, payload: raw }, update: {},
    });

    let link = await findLink(p.orderId, p.token, p.customerEmail);
    const isReady = p.event.toUpperCase() === "ACCESS_LINK_READY";
    const original = originalVendePayPayload(p.metadata);

    // n8n sends this only after Telegram. Save the original VendePay payload here
    // so delivery remains complete even if the optional parallel sales relay fails.
    if (!link && isReady && original) {
      await processCanonical(kirvano(original, "vendepay"));
      link = await findLink(p.orderId, p.token, p.customerEmail);
    }

    // Compatibility with older n8n callbacks that do not contain the original event.
    if (!link && isReady && p.orderId && p.customerEmail) {
      const email = p.customerEmail.toLowerCase().trim();
      const customer = await prisma.customer.upsert({
        where: { emailNormalized: email },
        create: { name: email.split("@")[0], email, emailNormalized: email }, update: {},
      });
      const order = await prisma.order.upsert({
        where: { source_externalOrderId: { source: "vendepay", externalOrderId: p.orderId } },
        create: { source: "vendepay", externalOrderId: p.orderId, customerId: customer.id, status: "PAID", type: "ONE_TIME", paymentMethod: "other", amountCents: 0, rawPayload: raw, approvedAt: new Date() }, update: {},
      });
      link = await prisma.accessLink.create({ data: { customerId: customer.id, orderId: order.id, status: "REQUESTED" } });
    }

    if (inbox.processedAt) return NextResponse.json({ ok: true, idempotent: true, token: link?.token, trackingUrl: link?.token ? `${host}/r/${link.token}` : null });
    if (!link) throw new Error("link not found");

    const event = p.event.toUpperCase();
    const token = p.token ?? link.token ?? randomUUID();
    const status = event.includes("ACCESSED") ? (link.status === "CONVERTED" ? "CONVERTED" : "ACCESSED") : event.includes("REVOKED") ? "REVOKED" : event.includes("EXPIRED") ? "EXPIRED" : (link.status === "CONVERTED" ? "CONVERTED" : "GENERATED");
    const saved = await prisma.accessLink.update({
      where: { id: link.id },
      data: { url: p.linkUrl ?? link.url, label: p.linkLabel ?? link.label, token, n8nRunId: p.n8nRunId ?? link.n8nRunId, metadata: p.metadata as any, status, generatedAt: status === "GENERATED" ? new Date() : link.generatedAt, lastAccessedAt: status === "ACCESSED" ? new Date() : link.lastAccessedAt, expiresAt: p.expiresAt ? new Date(p.expiresAt) : link.expiresAt },
    });
    await prisma.webhookInbox.update({ where: { id: inbox.id }, data: { processedAt: new Date() } });
    return NextResponse.json({ ok: true, token: saved.token, trackingUrl: `${host}/r/${saved.token}` });
  } catch (error) {
    console.error("[n8n-webhook]", error);
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }
}
