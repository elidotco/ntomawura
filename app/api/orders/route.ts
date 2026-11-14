// app/api/orders/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createSanityClient } from "@sanity/client";
import { runPostOrderTasks } from "@/lib/order-tasks";

// ─── Clients ──────────────────────────────────────────────────────────────────

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const sanity = createSanityClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  token: process.env.SANITY_API_TOKEN!,
  apiVersion: "2024-01-01",
  useCdn: false,
});

// ─── Types ────────────────────────────────────────────────────────────────────

type CartLine = { id: string; quantity: number };

interface OrderPayload {
  paymentMethod?: "delivery" | "instant";
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: string;
  deliveryNotes?: string;
  items: CartLine[]; // ids and quantities only, the server decides names and prices
}

type PricedLine = {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  image?: string;
};

type SaveInput = Omit<OrderPayload, "items" | "paymentMethod"> & {
  paymentMethod: "delivery" | "instant";
  subtotal: number;
  deliveryFee: number;
  total: number;
  lines: PricedLine[];
};

// ─── Pricing: always from Sanity, never from the browser ─────────────────────

async function calculateTotal(items: CartLine[]) {
  if (!items.length) throw new Error("Cart is empty");

  const ids = [...new Set(items.map((i) => i.id))];

  const products: {
    _id: string;
    name: string;
    price: number;
    stock?: number;
    inStock?: boolean;
    image?: string;
  }[] = await sanity.fetch(
    `*[_id in $ids && !(_id in path("drafts.**"))]{
      _id, name, price, stock, inStock, "image": images[0].asset->url + "?w=600&h=804&fit=crop&auto=format",
    }`,
    { ids },
  );

  if (products.length !== ids.length) throw new Error("Invalid cart");
  const byId = new Map(products.map((p) => [p._id, p]));

  const lines: PricedLine[] = items.map((i) => {
    const p = byId.get(i.id)!;
    const quantity = Math.floor(Number(i.quantity));
    if (!Number.isFinite(quantity) || quantity < 1 || quantity > 50) {
      throw new Error("Invalid quantity");
    }
    if (
      p.inStock === false ||
      (typeof p.stock === "number" && p.stock < quantity)
    ) {
      throw new Error(`${p.name} is out of stock`);
    }
    return {
      product_id: p._id,
      product_name: p.name,
      quantity,
      unit_price: Number(p.price),
      image: p.image,
    };
  });

  const total = lines.reduce((sum, l) => sum + l.unit_price * l.quantity, 0);
  return { total, lines };
}

// ─── Save to Supabase ─────────────────────────────────────────────────────────

async function saveToSupabase(input: SaveInput) {
  const { data, error } = await supabase
    .from("orders")
    .insert({
      customer_name: input.customerName,
      customer_email: input.customerEmail,
      customer_phone: input.customerPhone,
      delivery_address: input.deliveryAddress,
      delivery_notes: input.deliveryNotes || null,
      items: input.lines.map((l) => ({
        id: l.product_id,
        name: l.product_name,
        price: l.unit_price,
        quantity: l.quantity,
        image: l.image,
      })),
      subtotal: input.subtotal,
      delivery_fee: input.deliveryFee,
      total: input.total,
      payment_method: input.paymentMethod,
      order_status: "pending",
      payment_status: "unpaid",
    })
    .select()
    .single();

  if (error) throw new Error(`Supabase error: ${error.message}`);
  return data;
}

// ─── Main POST handler ────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body: OrderPayload = await req.json();

    const required = [
      "customerName",
      "customerEmail",
      "customerPhone",
      "deliveryAddress",
      "items",
    ];
    for (const field of required) {
      if (!body[field as keyof OrderPayload]) {
        return NextResponse.json(
          { error: `Missing field: ${field}` },
          { status: 400 },
        );
      }
    }
    if (!Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { error: "Order must have at least one item" },
        { status: 400 },
      );
    }

    const paymentMethod =
      body.paymentMethod === "instant" ? "instant" : "delivery";

    if (
      paymentMethod === "instant" &&
      body.customerEmail.endsWith("@noemail.com")
    ) {
      return NextResponse.json(
        { error: "A valid email is required for online payment" },
        { status: 400 },
      );
    }

    // Prices come from Sanity, never from the browser
    let pricing;
    try {
      pricing = await calculateTotal(body.items);
    } catch (e) {
      console.error("calculateTotal failed:", e);
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Invalid cart" },
        { status: 400 },
      );
    }

    const subtotal = pricing.total;
    const deliveryFee = 0; // decided on the server, ignore anything the client sends
    const total = subtotal + deliveryFee;

    // 1. Save to Supabase (must succeed)
    console.log("💾 Saving order to Supabase...");
    const order = await saveToSupabase({
      ...body,
      paymentMethod,
      subtotal,
      deliveryFee,
      total,
      lines: pricing.lines,
    });
    console.log(`✅ Order saved: ${order.order_number}`);

    // 2a. Instant payment: start Paystack.
    //     Notion, stock and emails wait for the webhook (payment confirmed).
    if (paymentMethod === "instant") {
      const res = await fetch(
        "https://api.paystack.co/transaction/initialize",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: body.customerEmail,
            amount: Math.round(total * 100), // pesewas
            currency: "GHS",
            reference: order.order_number,
            callback_url: `${process.env.SITE_URL}/order/${order.order_number}/confirmed`,
            metadata: { orderId: order.id, orderNumber: order.order_number },
          }),
        },
      );
      const json = await res.json().catch(() => null);

      if (!json?.status) {
        console.error("Paystack initialize failed:", json);
        await supabase
          .from("orders")
          .update({ order_status: "cancelled" })
          .eq("id", order.id);
        return NextResponse.json(
          { error: "Could not start payment. Please try again." },
          { status: 502 },
        );
      }

      return NextResponse.json({
        success: true,
        orderNumber: order.order_number,
        orderId: order.id,
        total,
        authorizationUrl: json.data.authorization_url,
      });
    }

    // 2b. Pay on delivery: run Notion, stock and emails now.
    //     Awaited on purpose, serverless hosts can kill un-awaited work.
    await runPostOrderTasks(order);

    return NextResponse.json({
      success: true,
      orderNumber: order.order_number,
      orderId: order.id,
      total: order.total,
    });
  } catch (err: any) {
    console.error("Order API error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to place order" },
      { status: 500 },
    );
  }
}

// ─── GET — fetch orders (admin) ───────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const email = searchParams.get("email");
  const limit = parseInt(searchParams.get("limit") || "50");
  const page = parseInt(searchParams.get("page") || "1");
  const offset = (page - 1) * limit;

  let query = supabase
    .from("orders")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) query = query.eq("order_status", status);
  if (email) query = query.eq("customer_email", email);

  const { data, error, count } = await query;
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    orders: data,
    total: count,
    page,
    limit,
    pages: Math.ceil((count || 0) / limit),
  });
}
