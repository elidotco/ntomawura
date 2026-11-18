import crypto from "crypto";

const sha = (v?: string) =>
  v
    ? crypto.createHash("sha256").update(v.trim().toLowerCase()).digest("hex")
    : undefined;

// 0244123456 or +233 24 412 3456 -> 233244123456
const normalizePhone = (p?: string) => {
  if (!p) return undefined;
  const d = p.replace(/\D/g, "");
  return d.startsWith("233") ? d : d.startsWith("0") ? "233" + d.slice(1) : d;
};

export type MetaPurchaseInput = {
  orderNumber: string;
  total: number;
  productIds?: string[];
  email?: string | null;
  phone?: string | null;
  ip?: string;
  userAgent?: string;
  fbp?: string;
  fbc?: string;
  sourceUrl?: string;
};

export async function sendMetaPurchase(o: MetaPurchaseInput) {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const token = process.env.META_CAPI_TOKEN;
  if (!pixelId || !token) {
    console.error(
      "Meta CAPI: missing NEXT_PUBLIC_META_PIXEL_ID or META_CAPI_TOKEN",
    );
    return;
  }

  // Checkout fills in "<phone>@noemail.com" when no email is given. Don't hash that.
  const realEmail =
    o.email && !o.email.endsWith("@noemail.com") ? o.email : undefined;
  const phone = normalizePhone(o.phone ?? undefined);

  const body = {
    data: [
      {
        event_name: "Purchase",
        event_time: Math.floor(Date.now() / 1000),
        event_id: `purchase_${o.orderNumber}`, // must match the browser eventID
        action_source: "website",
        event_source_url: o.sourceUrl,
        user_data: {
          em: realEmail ? [sha(realEmail)] : undefined,
          ph: phone ? [sha(phone)] : undefined,
          client_ip_address: o.ip,
          client_user_agent: o.userAgent,
          fbp: o.fbp,
          fbc: o.fbc,
        },
        custom_data: {
          value: o.total,
          currency: "GHS",
          content_type: "product",
          ...(o.productIds?.length && { content_ids: o.productIds }),
        },
      },
    ],
    ...(process.env.META_TEST_CODE && {
      test_event_code: process.env.META_TEST_CODE,
    }),
  };

  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${pixelId}/events?access_token=${token}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    );
    if (!res.ok) console.error("Meta CAPI error", res.status, await res.text());
  } catch (e) {
    // Never let tracking break an order
    console.error("Meta CAPI failed", e);
  }
}
