// app/api/orders/[orderNumber]/status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// Public, so it returns only what the confirmation page needs.
// No phone, email or address.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> },
) {
  const { orderNumber } = await params;

  const { data: order } = await supabase
    .from("orders")
    .select("order_number, total, payment_status, customer_name, items")
    .eq("order_number", orderNumber)
    .maybeSingle();

  if (!order) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(
    {
      orderNumber: order.order_number,
      paymentStatus: order.payment_status,
      total: Number(order.total),
      firstName: String(order.customer_name ?? "").split(" ")[0],
      productIds: Array.isArray(order.items)
        ? order.items.map((i: any) => String(i.id))
        : [],
      numItems: Array.isArray(order.items)
        ? order.items.reduce(
            (s: number, i: any) => s + Number(i.quantity || 1),
            0,
          )
        : 0,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
