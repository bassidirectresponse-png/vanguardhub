# Vanguard Hub

Painel interno para centralizar vendas, assinaturas, upsells e links de acesso. A interface é em pt-BR e usa o fuso `America/Sao_Paulo`.

## Subir localmente

1. Copie `.env.example` para `.env` e altere ao menos `ADMIN_PASSWORD`, `AUTH_SECRET` e os secrets dos webhooks.
2. Execute `docker compose up --build`.
3. Em outro terminal, se necessário: `pnpm db:migrate` e `pnpm db:seed`.
4. Abra `http://localhost:3000/login` com `ADMIN_EMAIL` e `ADMIN_PASSWORD`.

Não há cadastro público. O segundo usuário é criado em **Configurações → Usuários** por um SUPER_ADMIN.

## URLs para integrar

- Kirvano ou Kiwify: `https://SEU-HOST/api/webhooks/sales?token=SALES_WEBHOOK_SECRET`
- N8N devolvendo link: `https://SEU-HOST/api/webhooks/n8n` (header `x-n8n-secret` ou `x-webhook-secret`)
- N8N recebendo pedido de link: configure a URL do seu fluxo em `N8N_OUT_WEBHOOK_URL`; o Hub envia `x-vanguard-secret`.
- Ponte Utmify (opcional): `https://SEU-HOST/api/webhooks/utmify?token=UTMIFY_WEBHOOK_SECRET`.

Marque na plataforma os eventos aprovada, recusada, chargeback, reembolsada, renovada, atrasada, cancelada e pix/boleto gerado.

## Contrato N8N

Quando uma compra FRONT é aprovada, o Hub envia para `N8N_OUT_WEBHOOK_URL`:

```json
{"event":"ACCESS_LINK_REQUESTED","orderId":"D2RP8RQ7","source":"kirvano","customer":{"name":"João","email":"joao@empresa.com","phone":"5511999999999","document":"12345678901"},"products":[{"id":"produto","name":"Produto X","type":"front","priceInCents":11990}],"subscriptionId":null,"amountCents":11990,"utm":{},"occurredAt":"2026-09-14T17:00:00.000Z"}
```

Para devolver o acesso, o N8N envia:

```json
{"event":"ACCESS_LINK_READY","orderId":"D2RP8RQ7","customerEmail":"joao@empresa.com","linkUrl":"https://membros.empresa.com/go/abc123","linkLabel":"Área de membros","token":"abc123","n8nRunId":"run_123","expiresAt":null,"metadata":{}}
```

Os eventos `ACCESS_LINK_UPDATED`, `ACCESS_LINK_ACCESSED`, `ACCESS_REVOKED` e `access_link.expired` também são aceitos.

## Curls de teste

```bash
curl -X POST 'http://localhost:3000/api/webhooks/sales?token=troque' -H 'content-type: application/json' -d '{"event":"SALE_APPROVED","sale_id":"TEST-1","type":"RECURRING","total_price":"R$ 169,80","created_at":"2026-09-14 16:40:06","customer":{"name":"João da Silva","email":"joao@teste.local","document":"23875090127"},"products":[{"id":"produto-1","name":"Produto X","price":"R$ 169,80"}],"plan":{"name":"Plano Anual","charge_frequency":"ANNUALLY"}}'
curl -X POST 'http://localhost:3000/api/webhooks/n8n' -H 'content-type: application/json' -H 'x-n8n-secret: troque' -d '{"event":"ACCESS_LINK_READY","orderId":"TEST-1","customerEmail":"joao@teste.local","linkUrl":"https://membros.exemplo/go/abc"}'
curl -X GET http://localhost:3000/api/health
```

## Produtos e segurança

Em **Configurações → Produtos**, classifique os produtos como `FRONT`, `UPSELL`, `ORDER_BUMP` ou `SUBSCRIPTION`. A classificação atualiza os itens existentes para que a visão do cliente relacione upsells ao último front pago.

Cada endpoint público exige secret em `Authorization: Bearer`, no header específico ou em `?token=`. Os payloads entram primeiro em `WebhookInbox`, usando a chave de origem + evento + pedido + data para replays idempotentes. Falhas de N8N ou Utmify não impedem a venda; ficam em `WebhookOutbox`.
