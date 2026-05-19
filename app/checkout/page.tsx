"use client";

import { useCart } from "@/lib/context/CartContext";
import { useState } from "react";
import { useRouter } from "next/navigation";

const styles = `@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;1,300;1,400&family=Jost:wght@300;400;500&display=swap');`;

type FormValues = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  region: string;
  deliveryNotes: string;
};

type FormErrors = Partial<Record<keyof FormValues, string | null>>;

type CompletedOrder = {
  orderNumber: string;
  total: number;
  customerName: string;
};

const WHATSAPP_NUMBER = "233202918388";

function buildTrackingMessage({
  orderNumber,
  customerName,
}: {
  orderNumber: string;
  customerName: string;
}) {
  return encodeURIComponent(
    `Hello Ntomawura 👋\n\nI just placed an order on your website and would love to receive updates.\n\n*Order Number:* ${orderNumber}\n*Name:* ${customerName}\n\nKindly confirm receipt and keep me posted on my delivery. Thank you! 🙏`,
  );
}

type FieldProps = {
  label: string;
  k: keyof FormValues;
  placeholder: string;
  type?: string;
  colSpan?: string;
  textarea?: boolean;
};

export default function NtomawuraCheckout() {
  const router = useRouter();

  const [form, setForm] = useState<FormValues>({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    region: "",
    deliveryNotes: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [completedOrder, setCompletedOrder] = useState<CompletedOrder | null>(
    null,
  );

  const { items: cartItems, clearCart } = useCart() || {};
  const cart = cartItems ?? [];

  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const total = subtotal;

  const update = <K extends keyof FormValues>(k: K, v: FormValues[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: null }));
    if (apiError) setApiError("");
  };

  const validate = (): boolean => {
    const required: (keyof FormValues)[] = [
      "firstName",
      "lastName",
      "phone",
      "address",
      "city",
      "region",
    ];
    const newErrors: FormErrors = {};
    required.forEach((k) => {
      if (!form[k].trim()) newErrors[k] = "Required";
    });
    if (form.phone && !/^[0-9+\s]{9,15}$/.test(form.phone))
      newErrors.phone = "Enter a valid phone number";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      newErrors.email = "Enter a valid email";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCheckout = async () => {
    if (!validate()) return;
    setLoading(true);
    setApiError("");

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: `${form.firstName} ${form.lastName}`.trim(),
          customerEmail: form.email || `${form.phone}@noemail.com`,
          customerPhone: form.phone,
          deliveryAddress: `${form.address}, ${form.city}, ${form.region}`,
          deliveryNotes: form.deliveryNotes || undefined,
          deliveryFee: 0,
          items: cart.map((i) => ({
            id: i._id,
            name: i.name,
            price: i.price,
            quantity: i.quantity,
            image: i.image,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(
          data.error || "Something went wrong. Please try again.",
        );
      }
      clearCart?.();

      setCompletedOrder({
        orderNumber: data.orderNumber,
        total: data.total,
        customerName: `${form.firstName} ${form.lastName}`.trim(),
      });
    } catch (err) {
      setApiError(
        err instanceof Error ? err.message : "An unexpected error occurred.",
      );
    } finally {
      setLoading(false);
    }
  };

  const openWhatsApp = () => {
    if (!completedOrder) return;
    const msg = buildTrackingMessage({
      orderNumber: completedOrder.orderNumber,
      customerName: completedOrder.customerName,
    });
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, "_blank");
  };

  const Field = ({
    label,
    k,
    placeholder,
    type = "text",
    colSpan = "col-span-2",
    textarea = false,
  }: FieldProps) => (
    <div className={colSpan}>
      <label className="block text-[10px] tracking-[0.18em] uppercase text-[#8a7d64] mb-2">
        {label}
      </label>
      {textarea ? (
        <textarea
          value={form[k]}
          onChange={(e) => update(k, e.target.value)}
          placeholder={placeholder}
          rows={2}
          className="w-full bg-transparent border-b border-[#d4cdc0] py-2.5 text-[13px] text-[#2c2b27] placeholder-[#c5bdb0] focus:outline-none focus:border-[#8a7d64] transition-colors duration-200 resize-none"
        />
      ) : (
        <input
          type={type}
          value={form[k]}
          onChange={(e) => update(k, e.target.value)}
          placeholder={placeholder}
          className={`w-full bg-transparent border-b py-2.5 text-[13px] text-[#2c2b27] placeholder-[#c5bdb0] focus:outline-none transition-colors duration-200 ${
            errors[k]
              ? "border-rose-400"
              : "border-[#d4cdc0] focus:border-[#8a7d64]"
          }`}
        />
      )}
      {errors[k] && (
        <p className="text-[10px] text-rose-400 mt-1 tracking-wide">
          {errors[k]}
        </p>
      )}
    </div>
  );

  // rest of JSX unchanged...

  // ── Success screen ────────────────────────────────────────────────────────
  if (completedOrder) {
    // clear cart after successful order

    return (
      <div className="min-h-screen bg-[#F5F2EC] flex flex-col items-center justify-center px-6 text-center">
        <style>{styles}</style>

        {/* Animated checkmark */}
        <div className="w-16 h-16 border border-[#b5a98a] rounded-full flex items-center justify-center mb-6 animate-[fadeIn_0.5s_ease]">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M5 12l5 5L19 7"
              stroke="#b5a98a"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <p className="text-[10px] tracking-[0.22em] uppercase text-[#8a7d64] mb-3">
          Order saved
        </p>

        <h1
          className="text-4xl font-light text-[#2c2b27] mb-2 leading-tight"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          Thank you,
          <br />
          <em className="italic text-[#c9b98a]">
            {completedOrder.customerName.split(" ")[0]}.
          </em>
        </h1>

        {/* Order number pill */}
        <div className="flex items-center gap-3 my-5">
          <span className="h-px w-8 bg-[#d4cdc0]" />
          <span className="text-[11px] tracking-[0.2em] uppercase text-[#8a7d64] border border-[#d4cdc0] px-4 py-1.5">
            {completedOrder.orderNumber}
          </span>
          <span className="h-px w-8 bg-[#d4cdc0]" />
        </div>

        <p className="text-[13px] text-[#5c5447] max-w-sm leading-relaxed mb-3 tracking-wide">
          Your order has been received and saved. A confirmation email is on its
          way.
        </p>
        <p className="text-[13px] text-[#5c5447] max-w-sm leading-relaxed mb-8 tracking-wide">
          Send us a WhatsApp message with your order number and we'll keep you
          updated on your delivery every step of the way.
        </p>

        {/* WhatsApp CTA */}
        <button
          onClick={openWhatsApp}
          className="flex items-center gap-3 bg-[#25D366] text-white text-[11px] tracking-[0.18em] uppercase px-8 py-4 hover:bg-[#1ebe5d] transition-colors duration-200 mb-4"
        >
          <WhatsAppIcon />
          Send order number to WhatsApp
        </button>

        {/* What to expect */}
        <div className="mt-8 max-w-xs text-left border border-[#d4cdc0] p-5">
          <p className="text-[10px] tracking-[0.2em] uppercase text-[#8a7d64] mb-4">
            What happens next
          </p>
          {[
            ["1", "We confirm your order via WhatsApp within a few hours"],
            ["2", "Your fabrics are carefully packaged for delivery"],
            ["3", "Pay only when your fabrics arrive at your door"],
          ].map(([num, text]) => (
            <div key={num} className="flex gap-3 mb-3 last:mb-0">
              <span className="text-[10px] text-[#b5a98a] tracking-widest mt-0.5 w-3 shrink-0">
                {num}.
              </span>
              <p className="text-[12px] text-[#5c5447] leading-relaxed tracking-wide">
                {text}
              </p>
            </div>
          ))}
        </div>

        <p className="text-[11px] text-[#b5a98a] mt-6 tracking-wide">
          Keep your order number{" "}
          <strong className="text-[#8a7d64]">
            {completedOrder.orderNumber}
          </strong>{" "}
          handy for reference.
        </p>
      </div>
    );
  }

  // ── Main checkout ─────────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen bg-[#F5F2EC]"
      style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300 }}
    >
      <style>{styles}</style>

      {/* Nav */}

      {/* Body */}
      <div className="grid grid-cols-1 font-medium text-gray-950 lg:grid-cols-[1fr_680px] min-h-[calc(100vh-57px)]">
        {/* ── Left: Form ── */}
        <div className="px-6 lg:px-14 py-10 border-r border-[#d4cdc0]">
          {/* Contact */}
          <SectionLabel text="Contact information" />
          <div className="grid grid-cols-2 gap-x-6 gap-y-7 mb-10">
            <Field
              label="First name"
              k="firstName"
              placeholder="Ama"
              colSpan="col-span-1"
            />
            <Field
              label="Last name"
              k="lastName"
              placeholder="Mensah"
              colSpan="col-span-1"
            />
            <Field
              label="Phone (WhatsApp)"
              k="phone"
              placeholder="+233 24 000 0000"
              type="tel"
            />
            <Field
              label="Email (optional)"
              k="email"
              placeholder="ama@example.com"
              type="email"
            />
          </div>

          <hr className="border-[#d4cdc0] mb-10" />

          {/* Delivery */}
          <SectionLabel text="Delivery address" />
          <div className="grid grid-cols-2 gap-x-6 gap-y-7 mb-10">
            <Field
              label="Street address"
              k="address"
              placeholder="14 Cantonments Road"
            />
            <Field
              label="City / Town"
              k="city"
              placeholder="Accra"
              colSpan="col-span-1"
            />
            <Field
              label="Region"
              k="region"
              placeholder="Greater Accra"
              colSpan="col-span-1"
            />
            <Field
              label="Delivery notes (optional)"
              k="deliveryNotes"
              placeholder="e.g. Call before arriving · Leave with security"
              textarea
            />
          </div>

          <hr className="border-[#d4cdc0] mb-10" />

          {/* Payment */}
          <SectionLabel text="Payment method" />
          <div className="flex items-start gap-4 border border-[#b5a98a] bg-[#eee9de] p-4 mb-10">
            <div className="w-4 h-4 rounded-full border border-[#8a7d64] flex items-center justify-center mt-0.5 flex-shrink-0">
              <div className="w-2 h-2 rounded-full bg-[#8a7d64]" />
            </div>
            <div>
              <p className="text-[13px] tracking-wide text-[#2c2b27] mb-1">
                Cash on Delivery
              </p>
              <p className="text-[11px] text-[#8a7d64] leading-relaxed">
                Pay when your fabrics arrive. No card or mobile money needed
                upfront.
              </p>
            </div>
          </div>

          {/* API error */}
          {apiError && (
            <div className="border border-rose-300 bg-rose-50 px-4 py-3 mb-6">
              <p className="text-[12px] text-rose-600 tracking-wide">
                {apiError}
              </p>
            </div>
          )}

          {/* CTA */}
          <button
            onClick={handleCheckout}
            disabled={loading}
            className="w-full bg-[#2c2b27] text-[#f5f2ec] text-[11px] tracking-[0.22em] uppercase py-4 flex items-center justify-center gap-3 hover:bg-[#1a1a18] transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Spinner />
                Placing your order…
              </>
            ) : (
              <>
                Place Order
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

          <p className="text-center text-[11px] text-[#8a7d64] mt-4 tracking-wide">
            Your order is saved instantly. Then send us a WhatsApp to track
            delivery.
          </p>
        </div>

        {/* ── Right: Summary ── */}
        <div className="bg-[#eee9de] px-6 lg:px-8 py-10 flex flex-col">
          <SectionLabel text="Order summary" />

          {/* Items */}
          <div className="flex flex-col gap-6 mb-8">
            {cart.map((item) => (
              <div
                key={item._id}
                className="flex items-start justify-between gap-4"
              >
                {item.image && (
                  <img
                    src={`${item.image}?w=80&h=100&fit=crop`}
                    alt={item.name}
                    className="w-20 h-24 object-cover rounded shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-[#2c2b27] tracking-wide truncate">
                    {item.name}
                  </p>
                  <p className="text-[11px] text-[#8a7d64] tracking-wide mt-1">
                    {`${item.quantity * 6} yards · GH₵${item.price} per 6 yards`}
                  </p>
                  <p className="text-[11px] text-[#8a7d64] tracking-wide mt-0.5">
                    Qty: {item.quantity}
                  </p>
                </div>
                <p className="text-[13px] text-[#2c2b27] whitespace-nowrap">
                  GH₵{(item.price * item.quantity).toFixed(2)}
                </p>
              </div>
            ))}
          </div>

          <hr className="border-[#d4cdc0] mb-6" />

          {/* Totals */}
          <div className="flex flex-col gap-3 mb-6">
            <div className="flex justify-between text-[12px] text-[#5c5447]">
              <span className="tracking-wide">Subtotal</span>
              <span>GH₵{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[12px] text-[#5c5447]">
              <span className="tracking-wide">Delivery</span>
              <span
                className="text-[#8a7d64] italic"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                Free
              </span>
            </div>
            <div className="flex justify-between text-[12px] text-[#5c5447]">
              <span className="tracking-wide">Payment</span>
              <span
                className="text-[#8a7d64] italic"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                On delivery
              </span>
            </div>
          </div>

          <hr className="border-[#d4cdc0] mb-6" />

          <div className="flex justify-between items-baseline">
            <span className="text-[10px] tracking-[0.18em] uppercase text-[#8a7d64]">
              Total
            </span>
            <span
              className="text-3xl font-light text-[#2c2b27]"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              GH₵{total.toFixed(2)}
            </span>
          </div>

          {/* Trust badges */}
          <div className=" pt-8 border-t border-[#d4cdc0] mt-8 flex flex-col gap-3">
            {[
              "Free delivery anywhere in Ghana",
              "Pay only when your fabrics arrive",
              "Order tracked via WhatsApp",
              "Order number emailed instantly",
            ].map((t) => (
              <div
                key={t}
                className="flex items-center gap-3 text-[11px] text-[#8a7d64] tracking-wide"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  className="flex-shrink-0"
                >
                  <path
                    d="M2 6l3 3 5-5"
                    stroke="#b5a98a"
                    strokeWidth="1"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {t}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionLabel({ text }: { text: string }) {
  return (
    <p className="flex items-center gap-3 text-[10px] tracking-[0.22em] uppercase text-[#8a7d64] mb-7">
      <span className="block w-6 h-px bg-[#8a7d64]" />
      {text}
    </p>
  );
}

function WhatsAppIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="opacity-90"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg
      className="animate-spin"
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
    >
      <circle
        cx="7"
        cy="7"
        r="5.5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeDasharray="28"
        strokeDashoffset="10"
        strokeLinecap="round"
      />
    </svg>
  );
}
