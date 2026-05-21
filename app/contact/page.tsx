"use client";

import { useState, useEffect, useRef } from "react";

const SUBJECTS = [
  "Order enquiry",
  "Product question",
  "Wholesale / bulk",
  "Collaboration",
  "Other",
];

export default function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
    website: "", // honeypot — hidden from real users
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [apiError, setApiError] = useState("");
  const startTime = useRef(Date.now());

  const update = (k: string, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: "" }));
    if (apiError) setApiError("");
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Required";
    if (!form.email.trim()) e.email = "Required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "Enter a valid email";
    if (!form.subject) e.subject = "Please choose a subject";
    if (!form.message.trim()) e.message = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    setApiError("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          submittedAt: startTime.current,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success)
        throw new Error(data.error || "Something went wrong.");
      setSent(true);
    } catch (err: any) {
      setApiError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-[#F5F2EC] flex flex-col items-center justify-center px-6 text-center">
        <div className="w-14 h-14 border border-[#b5a98a] rounded-full flex items-center justify-center mb-6">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M4 10l4.5 4.5L16 6"
              stroke="#b5a98a"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <p className="text-[10px] tracking-[0.22em] uppercase text-[#8a7d64] mb-3">
          Message sent
        </p>
        <h2 className="text-4xl font-light text-[#2c2b27] mb-4 leading-snug font-serif">
          We'll be in touch,
          <br />
          <em className="italic text-[#c9b98a]">{form.name.split(" ")[0]}.</em>
        </h2>
        <p className="text-sm text-[#5c5447] max-w-sm leading-relaxed tracking-wide">
          Thank you for reaching out. We typically respond within 24 hours on
          business days.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F2EC]">
      {/* Hero */}
      <div className="min-h-[60vh] styles flex flex-col items-center justify-center w-full mb-20 gap-10 text-[#faf8f5]">
        <h1 className="text-6xl">Contact</h1>
        <p className="text-xl md:text-3xl">We Would Love To Hear From You</p>
      </div>

      {/* Content grid */}
      <section className="max-w-6xl mx-auto px-6 lg:px-10 pb-24 grid grid-cols-1 lg:grid-cols-[1fr_1.6fr] gap-16">
        {/* Left: Store info */}
        <div>
          <SectionLabel text="Find us" />
          <div className="flex flex-col gap-10">
            <InfoBlock
              icon={<PhoneIcon />}
              label="WhatsApp & Calls"
              lines={["+233 55 612 7550"]}
              note="Mon – Sat, 8am – 6pm"
            />
            <InfoBlock
              icon={<MailIcon />}
              label="Email"
              lines={["ntomawuraghana@gmail.com"]}
              note="We reply within 24 hours"
            />
            <InfoBlock
              icon={<PinIcon />}
              label="Showroom"
              lines={["Kaneshie footbridge, Accra, Ghana"]}
              note="By appointment only"
            />
            <InfoBlock
              icon={<ClockIcon />}
              label="Business Hours"
              lines={["Monday – Saturday", "8:00 am – 6:00 pm"]}
            />
          </div>

          <div className="h-px w-full bg-[#d4cdc0] my-10" />

          <p className="text-[10px] tracking-[0.22em] uppercase text-[#8a7d64] mb-5">
            Follow us
          </p>
          <div className="flex gap-5">
            {[
              { label: "Instagram", href: "#" },
              { label: "Facebook", href: "#" },
              { label: "TikTok", href: "#" },
            ].map(({ label, href }) => (
              <a
                key={label}
                href={href}
                className="text-[11px] tracking-[0.15em] uppercase text-[#8a7d64] hover:text-[#2c2b27] transition-colors border-b border-[#d4cdc0] hover:border-[#8a7d64] pb-0.5"
              >
                {label}
              </a>
            ))}
          </div>
        </div>

        {/* Right: Form */}
        <div>
          <SectionLabel text="Send a message" />

          {/* Honeypot — hidden from real users, bots fill it */}
          <div className="hidden" aria-hidden="true">
            <input
              tabIndex={-1}
              autoComplete="off"
              value={form.website}
              onChange={(e) => update("website", e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Field label="Full name" error={errors.name}>
                <input
                  className={`w-full bg-transparent border-0 border-b pb-2.5 pt-2 text-sm text-[#2c2b27] placeholder-[#c5bdb0] outline-none transition-colors focus:border-[#8a7d64] ${errors.name ? "border-rose-400" : "border-[#d4cdc0]"}`}
                  placeholder="Ama Mensah"
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                />
              </Field>
              <Field label="Email address" error={errors.email}>
                <input
                  type="email"
                  className={`w-full bg-transparent border-0 border-b pb-2.5 pt-2 text-sm text-[#2c2b27] placeholder-[#c5bdb0] outline-none transition-colors focus:border-[#8a7d64] ${errors.email ? "border-rose-400" : "border-[#d4cdc0]"}`}
                  placeholder="ama@example.com"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Field label="Phone (optional)">
                <input
                  type="tel"
                  className="w-full bg-transparent border-0 border-b border-[#d4cdc0] pb-2.5 pt-2 text-sm text-[#2c2b27] placeholder-[#c5bdb0] outline-none transition-colors focus:border-[#8a7d64]"
                  placeholder="+233 24 000 0000"
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                />
              </Field>
              <Field label="Subject" error={errors.subject}>
                <select
                  className={`w-full bg-transparent border-0 border-b pb-2.5 pt-2 text-sm text-[#2c2b27] outline-none transition-colors cursor-pointer focus:border-[#8a7d64] ${errors.subject ? "border-rose-400" : "border-[#d4cdc0]"}`}
                  value={form.subject}
                  onChange={(e) => update("subject", e.target.value)}
                >
                  <option value="">Select a subject…</option>
                  {SUBJECTS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Your message" error={errors.message}>
              <textarea
                className={`w-full bg-transparent border-0 border-b pb-2.5 pt-2 text-sm text-[#2c2b27] placeholder-[#c5bdb0] outline-none resize-none transition-colors focus:border-[#8a7d64] ${errors.message ? "border-rose-400" : "border-[#d4cdc0]"}`}
                placeholder="Tell us how we can help…"
                rows={5}
                value={form.message}
                onChange={(e) => update("message", e.target.value)}
              />
            </Field>

            {apiError && (
              <p className="text-xs text-rose-500 tracking-wide border border-rose-200 bg-rose-50 px-4 py-3">
                {apiError}
              </p>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-[#2c2b27] hover:bg-[#1a1a18] disabled:opacity-60 disabled:cursor-not-allowed text-[#f5f2ec] py-4 text-[11px] tracking-[0.22em] uppercase flex items-center justify-center gap-2.5 transition-colors"
            >
              {loading ? (
                <>
                  <Spinner /> Sending…
                </>
              ) : (
                <>
                  Send message
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path
                      d="M2 7h10M8 3l4 4-4 4"
                      stroke="currentColor"
                      strokeWidth="1"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </>
              )}
            </button>

            <p className="text-[11px] text-[#b5a98a] tracking-wide text-center">
              We typically respond within 24 hours on business days.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function SectionLabel({ text }: { text: string }) {
  return (
    <p className="flex items-center gap-3 text-[10px] tracking-[0.22em] uppercase text-[#8a7d64] mb-8">
      <span className="block w-6 h-px bg-[#8a7d64]" />
      {text}
    </p>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-[10px] tracking-[0.18em] uppercase text-[#8a7d64] mb-2">
        {label}
      </label>
      {children}
      {error && (
        <p className="text-[10px] text-rose-400 mt-1 tracking-wide">{error}</p>
      )}
    </div>
  );
}

function InfoBlock({
  icon,
  label,
  lines,
  note,
}: {
  icon: React.ReactNode;
  label: string;
  lines: string[];
  note?: string;
}) {
  return (
    <div className="flex gap-4">
      <div className="w-8 h-8 border border-[#d4cdc0] rounded-full flex items-center justify-center shrink-0 mt-0.5">
        {icon}
      </div>
      <div>
        <p className="text-[10px] tracking-[0.18em] uppercase text-[#8a7d64] mb-1">
          {label}
        </p>
        {lines.map((l) => (
          <p key={l} className="text-sm text-[#2c2b27] tracking-wide">
            {l}
          </p>
        ))}
        {note && (
          <p className="text-[11px] text-[#b5a98a] tracking-wide mt-0.5">
            {note}
          </p>
        )}
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg
      className="animate-spin"
      width="13"
      height="13"
      viewBox="0 0 13 13"
      fill="none"
    >
      <circle
        cx="6.5"
        cy="6.5"
        r="5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeDasharray="26"
        strokeDashoffset="9"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <path
        d="M2 2.5c0-.3.2-.5.5-.5h2l1 2.5-.8.8a7 7 0 002.5 2.5l.8-.8L10.5 8v2c0 .3-.2.5-.5.5A8.5 8.5 0 011.5 3c0-.3.2-.5.5-.5z"
        stroke="#8a7d64"
        strokeWidth="0.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <rect
        x="1"
        y="3"
        width="11"
        height="7.5"
        rx="1"
        stroke="#8a7d64"
        strokeWidth="0.9"
      />
      <path
        d="M1 4l5.5 4L12 4"
        stroke="#8a7d64"
        strokeWidth="0.9"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <path
        d="M6.5 1.5a4 4 0 014 4c0 2.8-4 7-4 7s-4-4.2-4-7a4 4 0 014-4z"
        stroke="#8a7d64"
        strokeWidth="0.9"
      />
      <circle cx="6.5" cy="5.5" r="1.2" stroke="#8a7d64" strokeWidth="0.9" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <circle cx="6.5" cy="6.5" r="5" stroke="#8a7d64" strokeWidth="0.9" />
      <path
        d="M6.5 4v2.5l1.5 1.5"
        stroke="#8a7d64"
        strokeWidth="0.9"
        strokeLinecap="round"
      />
    </svg>
  );
}
