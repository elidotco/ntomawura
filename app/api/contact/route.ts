// app/api/contact/route.ts
import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

// ─── In-memory rate limiter ───────────────────────────────────────────────────
// Stores: { ip -> { count, firstRequest } }
// Resets per IP after WINDOW_MS
const rateLimitMap = new Map<string, { count: number; firstRequest: number }>();

const WINDOW_MS = 60 * 60 * 1000; // 1 hour window
const MAX_REQUESTS = 3; // max 3 messages per IP per hour

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record) {
    rateLimitMap.set(ip, { count: 1, firstRequest: now });
    return false;
  }

  // Reset window if expired
  if (now - record.firstRequest > WINDOW_MS) {
    rateLimitMap.set(ip, { count: 1, firstRequest: now });
    return false;
  }

  // Within window — check count
  if (record.count >= MAX_REQUESTS) return true;

  record.count++;
  return false;
}

// Clean up old entries every hour to prevent memory leak
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimitMap.entries()) {
    if (now - record.firstRequest > WINDOW_MS) {
      rateLimitMap.delete(ip);
    }
  }
}, WINDOW_MS);

// ─── Spam keyword check ───────────────────────────────────────────────────────
const SPAM_KEYWORDS = [
  "casino",
  "crypto",
  "bitcoin",
  "forex",
  "loan offer",
  "make money",
  "click here",
  "buy now",
  "free offer",
  "winner",
  "congratulations",
  "investment opportunity",
  "whatsapp me",
  "telegram",
  "onlyfans",
  "seo service",
  "backlink",
  "adult",
  "viagra",
  "cialis",
];

function containsSpam(text: string): boolean {
  const lower = text.toLowerCase();
  return SPAM_KEYWORDS.some((kw) => lower.includes(kw));
}

// ─── URL count check (bots love pasting links) ────────────────────────────────
function countUrls(text: string): number {
  const urlPattern = /https?:\/\/[^\s]+/g;
  return (text.match(urlPattern) || []).length;
}

// ─── Main handler ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    // 1. Get IP for rate limiting
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";

    // 2. Rate limit check
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many messages. Please try again later." },
        { status: 429 },
      );
    }

    const body = await req.json();
    const { name, email, phone, subject, message, website, submittedAt } = body;

    // 3. Honeypot check — bots fill hidden fields, humans don't
    // The `website` field is hidden in the form via CSS (not type="hidden")
    // Bots auto-fill it; real users never see or touch it
    if (website && website.trim() !== "") {
      // Silently succeed — don't tell bots they were caught
      return NextResponse.json({ success: true });
    }

    // 4. Time check — bots submit instantly, humans take at least a few seconds
    const now = Date.now();
    const elapsed = submittedAt ? now - submittedAt : null;
    if (elapsed !== null && elapsed < 3000) {
      // Submitted in under 3 seconds — almost certainly a bot
      return NextResponse.json({ success: true }); // silent success
    }

    // 5. Validate required fields
    if (
      !name?.trim() ||
      !email?.trim() ||
      !subject?.trim() ||
      !message?.trim()
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // 6. Email format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 },
      );
    }

    // 7. Field length limits
    if (name.length > 100 || subject.length > 200 || message.length > 3000) {
      return NextResponse.json(
        { error: "Message is too long" },
        { status: 400 },
      );
    }

    // 8. Spam keyword detection
    if (containsSpam(message) || containsSpam(name)) {
      return NextResponse.json({ success: true }); // silent success
    }

    // 9. Too many URLs in message
    if (countUrls(message) > 2) {
      return NextResponse.json({ success: true }); // silent success
    }

    // 10. All checks passed — send emails
    await transporter.sendMail({
      from: `"Ntomawura Contact" <${process.env.GMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL,
      replyTo: email,
      subject: `✉️ New Message: ${subject} — ${name}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:580px;margin:0 auto;color:#1a1a1a;">
          <div style="background:#16213E;padding:20px 24px;border-radius:8px 8px 0 0;">
            <h2 style="color:#fff;margin:0;font-size:17px;">New Contact Message</h2>
            <p style="color:#90cdf4;margin:4px 0 0;font-size:12px;">${subject}</p>
          </div>

          <div style="padding:20px 24px;background:#fff;border:1px solid #e2e8f0;border-top:none;font-size:13px;">
            <table style="width:100%;border-collapse:collapse;">
              <tr><td style="padding:5px 0;color:#718096;width:80px;">Name</td><td style="font-weight:600;">${name}</td></tr>
              <tr><td style="padding:5px 0;color:#718096;">Email</td><td><a href="mailto:${email}" style="color:#185FA5;">${email}</a></td></tr>
              ${phone ? `<tr><td style="padding:5px 0;color:#718096;">Phone</td><td>${phone}</td></tr>` : ""}
              <tr><td style="padding:5px 0;color:#718096;">Subject</td><td>${subject}</td></tr>
            </table>

            <hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0;">

            <p style="font-size:11px;color:#8a7d64;text-transform:uppercase;letter-spacing:1px;margin:0 0 10px;">Message</p>
            <div style="background:#f7fafc;padding:14px;border-radius:6px;font-size:13px;line-height:1.7;white-space:pre-wrap;">${message}</div>
          </div>

          <div style="background:#f0ede6;padding:12px 24px;text-align:center;border-radius:0 0 8px 8px;border:1px solid #e2e8f0;border-top:none;">
            <p style="margin:0;font-size:11px;color:#8a7d64;">Reply to this email to respond directly to ${name}.</p>
          </div>
        </div>
      `,
    });

    await transporter.sendMail({
      from: `"Ntomawura" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: `We received your message ✨`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:580px;margin:0 auto;color:#1a1a1a;">
          <div style="background:#1A1A2E;padding:24px;text-align:center;border-radius:8px 8px 0 0;">
            <h1 style="color:#fff;margin:0;font-size:20px;font-weight:300;letter-spacing:2px;">NTOMAWURA</h1>
          </div>
          <div style="padding:28px 24px;background:#fff;border:1px solid #e2e8f0;border-top:none;text-align:center;">
            <p style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#8a7d64;margin:0 0 12px;">Message received</p>
            <h2 style="font-size:24px;font-weight:300;color:#2c2b27;margin:0 0 16px;">Thank you, ${name.split(" ")[0]}.</h2>
            <p style="font-size:13px;color:#5c5447;line-height:1.8;max-width:380px;margin:0 auto 24px;">
              We've received your message about <em>${subject.toLowerCase()}</em> and will get back to you within 24 hours on business days.
            </p>
            <div style="background:#f7fafc;border-radius:6px;padding:14px 20px;text-align:left;font-size:12px;color:#8a7d64;max-width:380px;margin:0 auto;">
              <p style="margin:0 0 6px;font-weight:500;">Your message:</p>
              <p style="margin:0;line-height:1.7;color:#5c5447;font-style:italic;">"${message.slice(0, 200)}${message.length > 200 ? "…" : ""}"</p>
            </div>
          </div>
          <div style="background:#f0ede6;padding:16px 24px;text-align:center;border-radius:0 0 8px 8px;border:1px solid #e2e8f0;border-top:none;">
            <p style="margin:0 0 6px;font-size:11px;color:#8a7d64;">Need urgent help? Reach us on WhatsApp</p>
            <a href="https://wa.me/233202918388" style="font-size:11px;color:#25D366;text-decoration:none;font-weight:500;">+233 20 291 8388</a>
          </div>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Contact API error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to send message" },
      { status: 500 },
    );
  }
}
