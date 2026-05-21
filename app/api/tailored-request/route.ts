import nodemailer from "nodemailer";
import { NextResponse } from "next/server";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function POST(req: Request) {
  const { product, name, contact, location, availability, notes } =
    await req.json();

  try {
    await transporter.sendMail({
      from: `"Ntomawura" <${process.env.GMAIL_USER}>`,
      to: process.env.GMAIL_USER,
      subject: `New Tailored Request — ${product}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 32px;">
          <h2 style="color: #2c2b27;">New Measurement Request</h2>
          <p style="color: #8a7d64; font-size: 13px; margin-bottom: 32px;">Submitted via ntomawura.com</p>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 12px 0; border-bottom: 1px solid #f0ede8; color: #8a7d64; font-size: 12px; width: 140px;">PRODUCT</td><td style="padding: 12px 0; border-bottom: 1px solid #f0ede8; font-size: 14px; color: #2c2b27;">${product}</td></tr>
            <tr><td style="padding: 12px 0; border-bottom: 1px solid #f0ede8; color: #8a7d64; font-size: 12px;">NAME</td><td style="padding: 12px 0; border-bottom: 1px solid #f0ede8; font-size: 14px; color: #2c2b27;">${name}</td></tr>
            <tr><td style="padding: 12px 0; border-bottom: 1px solid #f0ede8; color: #8a7d64; font-size: 12px;">CONTACT</td><td style="padding: 12px 0; border-bottom: 1px solid #f0ede8; font-size: 14px; color: #2c2b27;">${contact}</td></tr>
            <tr><td style="padding: 12px 0; border-bottom: 1px solid #f0ede8; color: #8a7d64; font-size: 12px;">LOCATION</td><td style="padding: 12px 0; border-bottom: 1px solid #f0ede8; font-size: 14px; color: #2c2b27;">${location}</td></tr>
            <tr><td style="padding: 12px 0; border-bottom: 1px solid #f0ede8; color: #8a7d64; font-size: 12px;">AVAILABILITY</td><td style="padding: 12px 0; border-bottom: 1px solid #f0ede8; font-size: 14px; color: #2c2b27;">${availability}</td></tr>
            ${notes ? `<tr><td style="padding: 12px 0; color: #8a7d64; font-size: 12px;">NOTES</td><td style="padding: 12px 0; font-size: 14px; color: #2c2b27;">${notes}</td></tr>` : ""}
          </table>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Email error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send email" },
      { status: 500 },
    );
  }
}
