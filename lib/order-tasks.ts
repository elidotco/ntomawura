// lib/order-tasks.ts
// Everything that happens AFTER an order is confirmed:
//  - pay on delivery  -> called straight from POST /api/orders
//  - instant payment  -> called from the Paystack webhook once payment succeeds

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

// ─── Types & helpers ──────────────────────────────────────────────────────────

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

function formatCurrency(amount: number | string): string {
  return `GHS ${Number(amount).toFixed(2)}`;
}

// Escape anything customer-supplied before it goes into email HTML
function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function paymentLabel(order: any): string {
  return order.payment_method === "instant" ? "Paid online" : "Pay on delivery";
}

// ─── Sync to Notion ───────────────────────────────────────────────────────────

export async function syncToNotion(order: any) {
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
      Subtotal: { number: Number(order.subtotal) },
      "Delivery Fee": { number: Number(order.delivery_fee) },
      "Total (GHS)": { number: Number(order.total) },
      "Payment Status": {
        select: { name: order.payment_status === "paid" ? "Paid" : "Unpaid" },
      },
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

// ─── Deduct stock in Sanity ───────────────────────────────────────────────────

export async function deductStock(items: OrderItem[]) {
  for (const item of items) {
    try {
      await sanity.patch(item.id).dec({ stock: item.quantity }).commit();

      const updated = await sanity.fetch<{ stock: number } | null>(
        `*[_id == $id][0]{ stock }`,
        { id: item.id },
      );
      if (updated && updated.stock <= 0) {
        await sanity.patch(item.id).set({ stock: 0, inStock: false }).commit();
      }
    } catch (err) {
      console.error(`Stock deduction failed for ${item.id}:`, err);
    }
  }
}

// ─── Customer confirmation email ──────────────────────────────────────────────

export async function sendCustomerEmail(order: any) {
  const itemRows = order.items
    .map(
      (i: OrderItem) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;">${esc(i.name)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:center;">${esc(i.quantity)}</td>
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
          <p style="color:#a0aec0;margin:6px 0 0;">${esc(order.order_number)}</p>
        </div>

        <div style="padding:24px;background:#fff;border:1px solid #e2e8f0;border-top:none;">
          <p style="font-size:15px;">Hi <strong>${esc(order.customer_name)}</strong>,</p>
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
            <tr>
              <td style="padding:6px 12px;color:#718096;">Payment</td>
              <td style="padding:6px 12px;text-align:right;">${paymentLabel(order)}</td>
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
            <p style="margin:4px 0;"><strong>Address:</strong> ${esc(order.delivery_address)}</p>
            <p style="margin:4px 0;"><strong>Phone:</strong> ${esc(order.customer_phone)}</p>
            ${order.delivery_notes ? `<p style="margin:4px 0;"><strong>Notes:</strong> ${esc(order.delivery_notes)}</p>` : ""}
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

// ─── Admin notification email ─────────────────────────────────────────────────

export async function sendAdminEmail(order: any) {
  const itemRows = order.items
    .map(
      (i: OrderItem) => `
      <tr>
        <td style="padding:12px;border-bottom:1px solid #f0f0f0;vertical-align:middle;">
          ${
            i.image
              ? `<img
                  src="${esc(i.image)}"
                  alt="${esc(i.name)}"
                  width="64"
                  height="80"
                  style="width:64px;height:80px;object-fit:cover;border-radius:4px;display:block;"
                />`
              : `<div style="width:64px;height:80px;background:#f0ede6;border-radius:4px;text-align:center;line-height:80px;">
                  <span style="font-size:10px;color:#b5a98a;">No image</span>
                </div>`
          }
        </td>
        <td style="padding:12px;border-bottom:1px solid #f0f0f0;vertical-align:middle;">
          <p style="margin:0 0 4px;font-weight:600;font-size:13px;color:#2c2b27;">${esc(i.name)}</p>
          <p style="margin:0;font-size:11px;color:#8a7d64;">Qty: ${esc(i.quantity)}</p>
        </td>
        <td style="padding:12px;border-bottom:1px solid #f0f0f0;vertical-align:middle;text-align:right;font-size:13px;color:#2c2b27;white-space:nowrap;">
          ${formatCurrency(i.price * i.quantity)}
        </td>
      </tr>`,
    )
    .join("");

  const paidBadge =
    order.payment_method === "instant"
      ? `<span style="background:#c6f6d5;color:#22543d;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:600;">PAID ONLINE</span>`
      : `<span style="background:#fefcbf;color:#744210;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:600;">PAY ON DELIVERY</span>`;

  await transporter.sendMail({
    from: `"Your Store" <${process.env.GMAIL_USER}>`,
    to: process.env.ADMIN_EMAIL,
    subject: `${order.payment_method === "instant" ? "💰 PAID" : "🚚 PAY ON DELIVERY"} · New Order ${order.order_number} — ${order.customer_name}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;color:#1a1a1a;">

        <!-- Header -->
        <div style="background:#16213E;padding:20px 24px;border-radius:8px 8px 0 0;">
          <h2 style="color:#fff;margin:0;font-size:18px;">🛍️ New Order Received</h2>
          <p style="color:#90cdf4;margin:4px 0 0;font-size:12px;">
            ${esc(order.order_number)} &nbsp;·&nbsp;
            ${new Date(order.created_at).toLocaleString("en-GH", { dateStyle: "medium", timeStyle: "short" })}
            &nbsp;·&nbsp; ${paidBadge}
          </p>
        </div>

        <!-- Customer details -->
        <div style="padding:20px 24px;background:#fff;border:1px solid #e2e8f0;border-top:none;">
          <h3 style="font-size:11px;color:#8a7d64;text-transform:uppercase;letter-spacing:1px;margin:0 0 12px;">
            Customer
          </h3>
          <table style="width:100%;border-collapse:collapse;font-size:13px;">
            <tr><td style="padding:4px 0;color:#718096;width:120px;">Name</td><td style="font-weight:600;">${esc(order.customer_name)}</td></tr>
            <tr><td style="padding:4px 0;color:#718096;">Email</td><td>${esc(order.customer_email)}</td></tr>
            <tr><td style="padding:4px 0;color:#718096;">Phone</td><td>${esc(order.customer_phone)}</td></tr>
            <tr><td style="padding:4px 0;color:#718096;">Address</td><td>${esc(order.delivery_address)}</td></tr>
            ${order.delivery_notes ? `<tr><td style="padding:4px 0;color:#718096;">Notes</td><td style="color:#c05621;">${esc(order.delivery_notes)}</td></tr>` : ""}
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
              <td style="text-align:right;">${formatCurrency(order.subtotal)}</td>
            </tr>
            <tr>
              <td style="padding:4px 0;color:#718096;">Delivery Fee</td>
              <td style="text-align:right;">${formatCurrency(order.delivery_fee)}</td>
            </tr>
            <tr style="font-weight:bold;font-size:15px;border-top:2px solid #e2e8f0;">
              <td style="padding:10px 0 4px;">Total</td>
              <td style="text-align:right;padding:10px 0 4px;">${formatCurrency(order.total)}</td>
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

// ─── Telegram alert to the admin ──────────────────────────────────────────────

// Ghana numbers: 024... -> 23324..., so the WhatsApp link works
function whatsappLink(phone: string): string | null {
  let digits = String(phone ?? "").replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("0")) digits = "233" + digits.slice(1);
  return `https://wa.me/${digits}`;
}

export async function sendTelegramAlert(order: any) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    console.warn(
      "Telegram not configured (TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID), skipping alert",
    );
    return;
  }

  const MAX_LINES = 15;
  const lines: OrderItem[] = order.items;
  const itemLines = lines
    .slice(0, MAX_LINES)
    .map(
      (i) =>
        `• ${esc(i.name)} × ${esc(i.quantity)} — ${formatCurrency(i.price * i.quantity)}`,
    );
  if (lines.length > MAX_LINES) {
    itemLines.push(`…and ${lines.length - MAX_LINES} more`);
  }

  const wa = whatsappLink(order.customer_phone);
  const parts = [
    order.payment_method === "instant"
      ? "💰 <b>New order — PAID ONLINE</b>"
      : "🚚 <b>New order — PAY ON DELIVERY</b>",
    `<b>${esc(order.order_number)}</b>`,
    "",
    ...itemLines,
    "",
    `<b>Total:</b> ${formatCurrency(order.total)}`,
    "",
    `<b>Customer:</b> ${esc(order.customer_name)}`,
    `<b>Phone:</b> ${esc(order.customer_phone)}${wa ? ` (<a href="${wa}">WhatsApp</a>)` : ""}`,
    `<b>Address:</b> ${esc(order.delivery_address)}`,
  ];
  if (order.delivery_notes) {
    parts.push(`<b>Notes:</b> ${esc(order.delivery_notes)}`);
  }

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: parts.join("\n"),
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) {
    throw new Error(`Telegram ${res.status}: ${await res.text()}`);
  }
}

// ─── Run everything once an order is confirmed ────────────────────────────────

export async function runPostOrderTasks(order: any) {
  const results = await Promise.allSettled([
    sendTelegramAlert(order),
    syncToNotion(order),
    deductStock(order.items),
    sendCustomerEmail(order),
    sendAdminEmail(order),
  ]);

  const names = [
    "Telegram alert",
    "Notion sync",
    "Stock deduction",
    "Customer email",
    "Admin email",
  ];
  results.forEach((r, i) => {
    if (r.status === "rejected") console.error(`${names[i]} failed:`, r.reason);
  });
}
