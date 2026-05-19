// app/api/orders/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Client } from "@notionhq/client";
import { createClient as createSanityClient } from "@sanity/client";
import nodemailer from "nodemailer";

// ─── Clients ──────────────────────────────────────────────────────────────────

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const notion = new Client({ auth: process.env.NOTION_API_KEY });

const sanity = createSanityClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  token: process.env.SANITY_API_TOKEN!,
  apiVersion: "2024-01-01",
  useCdn: false,
});

// Gmail transporter via Nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD, // App Password, not your Gmail password
  },
});

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface OrderPayload {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: string;
  deliveryNotes?: string;
  items: OrderItem[];
  deliveryFee?: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcSubtotal(items: OrderItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function formatCurrency(amount: number): string {
  return `GHS ${amount.toFixed(2)}`;
}

function formatItemsList(items: OrderItem[]): string {
  return items
    .map((i) => `${i.name} x${i.quantity} @ ${formatCurrency(i.price)}`)
    .join("\n");
}

// ─── Step 1: Save to Supabase ─────────────────────────────────────────────────

async function saveToSupabase(payload: OrderPayload) {
  const subtotal = calcSubtotal(payload.items);
  const deliveryFee = payload.deliveryFee ?? 0;
  const total = subtotal + deliveryFee;

  const { data, error } = await supabase
    .from("orders")
    .insert({
      customer_name: payload.customerName,
      customer_email: payload.customerEmail,
      customer_phone: payload.customerPhone,
      delivery_address: payload.deliveryAddress,
      delivery_notes: payload.deliveryNotes || null,
      items: payload.items,
      subtotal,
      delivery_fee: deliveryFee,
      total,
      order_status: "pending",
      payment_status: "unpaid",
    })
    .select()
    .single();

  if (error) throw new Error(`Supabase error: ${error.message}`);
  return data;
}

// ─── Step 2: Sync to Notion ───────────────────────────────────────────────────

async function syncToNotion(order: any) {
  const itemsSummary = order.items
    .map((i: OrderItem) => `${i.name} x${i.quantity}`)
    .join(", ");

  const page = await notion.pages.create({
    parent: { database_id: process.env.NOTION_ORDERS_DB_ID! },
    properties: {
      "Order #": {
        title: [{ text: { content: order.order_number } }],
      },
      "Customer Name": {
        rich_text: [{ text: { content: order.customer_name } }],
      },
      Email: { email: order.customer_email },
      Phone: { phone_number: order.customer_phone },
      "Delivery Address": {
        rich_text: [{ text: { content: order.delivery_address } }],
      },
      "Delivery Notes": {
        rich_text: [{ text: { content: order.delivery_notes || "—" } }],
      },
      Items: {
        rich_text: [{ text: { content: itemsSummary } }],
      },
      Subtotal: { number: order.subtotal },
      "Delivery Fee": { number: order.delivery_fee },
      "Total (GHS)": { number: order.total },
      "Payment Status": { select: { name: "Unpaid" } },
      "Order Status": { select: { name: "Pending" } },
      Date: { date: { start: new Date(order.created_at).toISOString() } },
    },
  });

  await supabase
    .from("orders")
    .update({ notion_page_id: page.id })
    .eq("id", order.id);

  return page.id;
}

// ─── Step 3: Deduct stock in Sanity ───────────────────────────────────────────

async function deductStock(items: OrderItem[]) {
  for (const item of items) {
    try {
      await sanity.patch(item.id).dec({ stock: item.quantity }).commit();

      const updated = await sanity.fetch<{ stock: number }>(
        `*[_id == $id][0]{ stock }`,
        { id: item.id },
      );
      if (updated?.stock <= 0) {
        await sanity.patch(item.id).set({ stock: 0, inStock: false }).commit();
      }
    } catch (err) {
      console.error(`Stock deduction failed for ${item.id}:`, err);
    }
  }
}

// ─── Step 4a: Customer confirmation email ─────────────────────────────────────

async function sendCustomerEmail(order: any) {
  const itemRows = order.items
    .map(
      (i: OrderItem) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;">${i.name}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:center;">${i.quantity}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:right;">${formatCurrency(i.price * i.quantity)}</td>
      </tr>`,
    )
    .join("");

  await transporter.sendMail({
    from: `"Your Store" <${process.env.GMAIL_USER}>`,
    to: order.customer_email,
    subject: `Order Confirmed ✅ — ${order.order_number}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a;">
        <div style="background:#1A1A2E;padding:24px;text-align:center;border-radius:8px 8px 0 0;">
          <h1 style="color:#fff;margin:0;font-size:22px;">Order Confirmed!</h1>
          <p style="color:#a0aec0;margin:6px 0 0;">${order.order_number}</p>
        </div>

        <div style="padding:24px;background:#fff;border:1px solid #e2e8f0;border-top:none;">
          <p style="font-size:15px;">Hi <strong>${order.customer_name}</strong>,</p>
          <p style="font-size:15px;color:#4a5568;">
            Thank you for your order! We've received it and will be in touch soon to confirm delivery.
          </p>

          <h3 style="font-size:13px;color:#718096;text-transform:uppercase;letter-spacing:1px;margin:24px 0 12px;">
            Order Summary
          </h3>
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <thead>
              <tr style="background:#f7fafc;">
                <th style="padding:10px 12px;text-align:left;">Item</th>
                <th style="padding:10px 12px;text-align:center;">Qty</th>
                <th style="padding:10px 12px;text-align:right;">Amount</th>
              </tr>
            </thead>
            <tbody>${itemRows}</tbody>
          </table>

          <table style="width:100%;font-size:14px;margin-top:12px;">
            <tr>
              <td style="padding:6px 12px;color:#718096;">Subtotal</td>
              <td style="padding:6px 12px;text-align:right;">${formatCurrency(order.subtotal)}</td>
            </tr>
            <tr>
              <td style="padding:6px 12px;color:#718096;">Delivery Fee</td>
              <td style="padding:6px 12px;text-align:right;">${formatCurrency(order.delivery_fee)}</td>
            </tr>
            <tr style="font-weight:bold;font-size:16px;border-top:2px solid #e2e8f0;">
              <td style="padding:10px 12px;">Total</td>
              <td style="padding:10px 12px;text-align:right;">${formatCurrency(order.total)}</td>
            </tr>
          </table>

          <div style="background:#f7fafc;border-radius:8px;padding:16px;margin-top:24px;font-size:14px;">
            <h3 style="margin:0 0 10px;font-size:13px;color:#718096;text-transform:uppercase;letter-spacing:1px;">
              Delivery Details
            </h3>
            <p style="margin:4px 0;"><strong>Address:</strong> ${order.delivery_address}</p>
            <p style="margin:4px 0;"><strong>Phone:</strong> ${order.customer_phone}</p>
            ${order.delivery_notes ? `<p style="margin:4px 0;"><strong>Notes:</strong> ${order.delivery_notes}</p>` : ""}
          </div>

          <p style="font-size:13px;color:#a0aec0;margin-top:24px;text-align:center;">
            Questions? Reply to this email and we'll help you out.
          </p>
        </div>

        <div style="background:#f7fafc;padding:16px;text-align:center;border-radius:0 0 8px 8px;border:1px solid #e2e8f0;border-top:none;">
          <p style="margin:0;font-size:12px;color:#a0aec0;">
            © ${new Date().getFullYear()} Your Store. All rights reserved.
          </p>
        </div>
      </div>
    `,
  });
}

// ─── Step 4b: Admin notification email ────────────────────────────────────────

async function sendAdminEmail(order: any) {
  const itemRows = order.items
    .map(
      (i: OrderItem) => `
      <tr>
        <td style="padding:12px;border-bottom:1px solid #f0f0f0;vertical-align:middle;">
          ${
            i.image
              ? `<img
                  src="${i.image}"
                  alt="${i.name}"
                  width="64"
                  height="80"
                  style="width:64px;height:80px;object-fit:cover;border-radius:4px;display:block;"
                />`
              : `<div style="width:64px;height:80px;background:#f0ede6;border-radius:4px;display:flex;align-items:center;justify-content:center;">
                  <span style="font-size:10px;color:#b5a98a;">No image</span>
                </div>`
          }
        </td>
        <td style="padding:12px;border-bottom:1px solid #f0f0f0;vertical-align:middle;">
          <p style="margin:0 0 4px;font-weight:600;font-size:13px;color:#2c2b27;">${i.name}</p>
          ${i.variant ? `<p style="margin:0 0 4px;font-size:11px;color:#8a7d64;">${i.variant}</p>` : ""}
          <p style="margin:0;font-size:11px;color:#8a7d64;">Qty: ${i.quantity}</p>
        </td>
        <td style="padding:12px;border-bottom:1px solid #f0f0f0;vertical-align:middle;text-align:right;font-size:13px;color:#2c2b27;white-space:nowrap;">
          GHS ${(i.price * i.quantity).toFixed(2)}
        </td>
      </tr>`,
    )
    .join("");

  await transporter.sendMail({
    from: `"Your Store" <${process.env.GMAIL_USER}>`,
    to: process.env.ADMIN_EMAIL,
    subject: `🛍️ New Order ${order.order_number} — ${order.customer_name}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;color:#1a1a1a;">

        <!-- Header -->
        <div style="background:#16213E;padding:20px 24px;border-radius:8px 8px 0 0;">
          <h2 style="color:#fff;margin:0;font-size:18px;">🛍️ New Order Received</h2>
          <p style="color:#90cdf4;margin:4px 0 0;font-size:12px;">
            ${order.order_number} &nbsp;·&nbsp;
            ${new Date(order.created_at).toLocaleString("en-GH", { dateStyle: "medium", timeStyle: "short" })}
          </p>
        </div>

        <!-- Customer details -->
        <div style="padding:20px 24px;background:#fff;border:1px solid #e2e8f0;border-top:none;">
          <h3 style="font-size:11px;color:#8a7d64;text-transform:uppercase;letter-spacing:1px;margin:0 0 12px;">
            Customer
          </h3>
          <table style="width:100%;border-collapse:collapse;font-size:13px;">
            <tr><td style="padding:4px 0;color:#718096;width:120px;">Name</td><td style="font-weight:600;">${order.customer_name}</td></tr>
            <tr><td style="padding:4px 0;color:#718096;">Email</td><td>${order.customer_email}</td></tr>
            <tr><td style="padding:4px 0;color:#718096;">Phone</td><td>${order.customer_phone}</td></tr>
            <tr><td style="padding:4px 0;color:#718096;">Address</td><td>${order.delivery_address}</td></tr>
            ${order.delivery_notes ? `<tr><td style="padding:4px 0;color:#718096;">Notes</td><td style="color:#c05621;">${order.delivery_notes}</td></tr>` : ""}
          </table>
        </div>

        <!-- Items with images -->
        <div style="padding:20px 24px;background:#fff;border:1px solid #e2e8f0;border-top:none;">
          <h3 style="font-size:11px;color:#8a7d64;text-transform:uppercase;letter-spacing:1px;margin:0 0 12px;">
            Items Ordered
          </h3>
          <table style="width:100%;border-collapse:collapse;">
            <thead>
              <tr style="background:#f7fafc;">
                <th style="padding:10px 12px;text-align:left;font-size:11px;color:#718096;font-weight:500;width:80px;">Image</th>
                <th style="padding:10px 12px;text-align:left;font-size:11px;color:#718096;font-weight:500;">Product</th>
                <th style="padding:10px 12px;text-align:right;font-size:11px;color:#718096;font-weight:500;">Amount</th>
              </tr>
            </thead>
            <tbody>${itemRows}</tbody>
          </table>
        </div>

        <!-- Totals -->
        <div style="padding:16px 24px;background:#f7fafc;border:1px solid #e2e8f0;border-top:none;">
          <table style="width:100%;font-size:13px;">
            <tr>
              <td style="padding:4px 0;color:#718096;">Subtotal</td>
              <td style="text-align:right;">GHS ${order.subtotal.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding:4px 0;color:#718096;">Delivery Fee</td>
              <td style="text-align:right;">GHS ${order.delivery_fee.toFixed(2)}</td>
            </tr>
            <tr style="font-weight:bold;font-size:15px;border-top:2px solid #e2e8f0;">
              <td style="padding:10px 0 4px;">Total</td>
              <td style="text-align:right;padding:10px 0 4px;">GHS ${order.total.toFixed(2)}</td>
            </tr>
          </table>
        </div>

        <!-- Footer -->
        <div style="background:#f0ede6;padding:14px 24px;text-align:center;border-radius:0 0 8px 8px;border:1px solid #e2e8f0;border-top:none;">
          <p style="margin:0;font-size:11px;color:#8a7d64;">
            Log in to Notion or Supabase to manage this order.
          </p>
        </div>
      </div>
    `,
  });
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

    // 1. Save to Supabase (must succeed)
    console.log("💾 Saving order to Supabase...");
    const order = await saveToSupabase(body);
    console.log(`✅ Order saved: ${order.order_number}`);

    // 2–4. Non-blocking background tasks
    syncToNotion(order).catch((err) =>
      console.error("Notion sync failed:", err),
    );
    deductStock(body.items).catch((err) =>
      console.error("Stock deduction failed:", err),
    );
    Promise.all([
      sendCustomerEmail(order).catch((err) =>
        console.error("Customer email failed:", err),
      ),
      sendAdminEmail(order).catch((err) =>
        console.error("Admin email failed:", err),
      ),
    ]);

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
