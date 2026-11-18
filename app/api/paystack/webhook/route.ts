import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { runPostOrderTasks } from "@/lib/order-tasks";
import { sendMetaPurchase } from "@/lib/metaCapi";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: NextRequest) {
  const raw = await req.text();
  const expected = crypto
    .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY!)
    .update(raw)
    .digest("hex");

  if (expected !== req.headers.get("x-paystack-signature")) {
    return new NextResponse("Invalid signature", { status: 401 });
  }

  const event = JSON.parse(raw);
  if (event.event !== "charge.success") return NextResponse.json({ ok: true });

  const reference = event.data.reference; // = order_number
  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("order_number", reference)
    .maybeSingle();

  if (!order) {
    console.error("Webhook: no order for reference", reference);
    return NextResponse.json({ ok: true });
  }

  if (
    event.data.currency !== "GHS" ||
    event.data.amount !== Math.round(Number(order.total) * 100)
  ) {
    console.error("Webhook: amount mismatch for", reference);
    return NextResponse.json({ ok: true });
  }

  // Only the first webhook flips unpaid to paid, so retries can't double-send
  const { data: updated } = await supabase
    .from("orders")
    .update({ payment_status: "paid" })
    .eq("order_number", reference)
    .eq("payment_status", "unpaid")
    .select("*");

  if (updated?.length) {
    const paidOrder = updated[0];

    // Meta Purchase (Conversions API). Sent first and wrapped so that a failure
    // in runPostOrderTasks can't stop it, and a Meta failure can't stop the order.
    // `tracking` was saved on the order when it was created (see orders route).
    try {
      const t = (paidOrder.tracking ?? {}) as {
        fbp?: string;
        fbc?: string;
        sourceUrl?: string;
        ip?: string;
        userAgent?: string;
      };

      // Adjust to however your order items are stored
      const productIds: string[] = Array.isArray(paidOrder.items)
        ? paidOrder.items
            .map((i: any) => String(i.product_id ?? i.id ?? i._id ?? ""))
            .filter(Boolean)
        : [];

      await sendMetaPurchase({
        orderNumber: paidOrder.order_number,
        total: Number(paidOrder.total),
        productIds,
        email: paidOrder.customer_email,
        phone: paidOrder.customer_phone,
        ip: t.ip,
        userAgent: t.userAgent,
        fbp: t.fbp,
        fbc: t.fbc,
        sourceUrl: t.sourceUrl,
      });
    } catch (e) {
      console.error("Webhook: Meta tracking failed", e);
    }

    await runPostOrderTasks(paidOrder);
  }

  return NextResponse.json({ ok: true });
}
