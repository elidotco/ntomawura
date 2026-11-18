// app/order/[orderNumber]/confirmed/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/lib/context/CartContext";
import { track } from "@/lib/fbpixel";

const styles = `@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;1,300;1,400&family=Jost:wght@300;400;500&display=swap');`;

const WHATSAPP_NUMBER = "233556127550";
const POLL_EVERY_MS = 2000;
const MAX_ATTEMPTS = 20; // about 40 seconds

type OrderStatus = {
  orderNumber: string;
  paymentStatus: string;
  total: number;
  firstName: string;
  productIds: string[];
  numItems: number;
};

type ViewState = "checking" | "paid" | "timeout" | "notfound";

export default function OrderConfirmedPage() {
  const params = useParams<{ orderNumber: string }>();
  const orderNumber = decodeURIComponent(params.orderNumber);

  const { clearCart } = useCart() || {};
  const [state, setState] = useState<ViewState>("checking");
  const [order, setOrder] = useState<OrderStatus | null>(null);
  const handledPaid = useRef(false);

  // Paystack redirects here before its webhook always lands, so poll until the
  // webhook has marked the order as paid.
  useEffect(() => {
    let cancelled = false;
    let attempts = 0;
    let timer: ReturnType<typeof setTimeout>;

    const poll = async () => {
      try {
        const res = await fetch(
          `/api/orders/${encodeURIComponent(orderNumber)}/status`,
          { cache: "no-store" },
        );
        if (res.status === 404) {
          if (!cancelled) setState("notfound");
          return;
        }
        const data: OrderStatus = await res.json();
        if (data.paymentStatus === "paid") {
          if (!cancelled) {
            setOrder(data);
            setState("paid");
          }
          return;
        }
      } catch {
        // network blip, try again
      }
      attempts++;
      if (cancelled) return;
      if (attempts >= MAX_ATTEMPTS) {
        setState("timeout");
        return;
      }
      timer = setTimeout(poll, POLL_EVERY_MS);
    };

    poll();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [orderNumber]);

  // Payment confirmed: report the sale to Meta once and clear the cart.
  useEffect(() => {
    if (state !== "paid" || !order || handledPaid.current) return;
    handledPaid.current = true;

    const key = `purchase_tracked_${order.orderNumber}`;
    let alreadyTracked = false;
    try {
      alreadyTracked = !!sessionStorage.getItem(key);
    } catch {}

    if (!alreadyTracked) {
      track(
        "Purchase",
        {
          value: order.total,
          currency: "GHS",
          content_ids: order.productIds,
          content_type: "product",
          num_items: order.numItems,
          payment_method: "instant",
        },
        // Same ID the webhook sends, so Meta counts the sale once
        `purchase_${order.orderNumber}`,
      );
      try {
        sessionStorage.setItem(key, "1");
      } catch {}
    }

    clearCart?.();
  }, [state, order, clearCart]);

  const openWhatsApp = () => {
    const msg = encodeURIComponent(
      `Hello Ntomawura 👋\n\nI just paid for my order on your website and would love to receive updates.\n\n*Order Number:* ${orderNumber}\n\nKindly confirm receipt and keep me posted on my delivery. Thank you! 🙏`,
    );
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, "_blank");
  };

  return (
    <div
      className="min-h-screen bg-[#F5F2EC] flex flex-col items-center justify-center px-6 text-center"
      style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300 }}
    >
      <style>{styles}</style>

      {state === "checking" && (
        <>
          <svg
            className="animate-spin mb-6"
            width="28"
            height="28"
            viewBox="0 0 14 14"
            fill="none"
          >
            <circle
              cx="7"
              cy="7"
              r="5.5"
              stroke="#b5a98a"
              strokeWidth="1.2"
              strokeDasharray="28"
              strokeDashoffset="10"
              strokeLinecap="round"
            />
          </svg>
          <p className="text-[10px] tracking-[0.22em] uppercase text-[#8a7d64] mb-3">
            Confirming your payment
          </p>
          <p className="text-[13px] text-[#5c5447] max-w-sm leading-relaxed tracking-wide">
            Please wait a moment and don't close this page.
          </p>
        </>
      )}

      {state === "paid" && order && (
        <>
          <div className="w-16 h-16 border border-[#b5a98a] rounded-full flex items-center justify-center mb-6">
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
            Payment received
          </p>

          <h1
            className="text-4xl font-light text-[#2c2b27] mb-2 leading-tight"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            Thank you,
            <br />
            <em className="italic text-[#c9b98a]">{order.firstName}.</em>
          </h1>

          <div className="flex items-center gap-3 my-5">
            <span className="h-px w-8 bg-[#d4cdc0]" />
            <span className="text-[11px] tracking-[0.2em] uppercase text-[#8a7d64] border border-[#d4cdc0] px-4 py-1.5">
              {order.orderNumber}
            </span>
            <span className="h-px w-8 bg-[#d4cdc0]" />
          </div>

          <p className="text-[13px] text-[#5c5447] max-w-sm leading-relaxed mb-3 tracking-wide">
            Your payment of GH₵{order.total.toFixed(2)} has been received. A
            confirmation email is on its way.
          </p>
          <p className="text-[13px] text-[#5c5447] max-w-sm leading-relaxed mb-8 tracking-wide">
            Send us a WhatsApp message with your order number and we'll keep you
            updated on your delivery every step of the way.
          </p>

          <button
            onClick={openWhatsApp}
            className="flex items-center gap-3 bg-[#25D366] text-white text-[11px] tracking-[0.18em] uppercase px-8 py-4 hover:bg-[#1ebe5d] transition-colors duration-200 mb-4"
          >
            Send order number to WhatsApp
          </button>

          <div className="mt-8 max-w-xs text-left border border-[#d4cdc0] p-5">
            <p className="text-[10px] tracking-[0.2em] uppercase text-[#8a7d64] mb-4">
              What happens next
            </p>
            {[
              ["1", "We confirm your order via WhatsApp within a few hours"],
              ["2", "Your fabrics are carefully packaged for delivery"],
              ["3", "Your order is delivered to your door"],
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
        </>
      )}

      {state === "timeout" && (
        <>
          <p className="text-[10px] tracking-[0.22em] uppercase text-[#8a7d64] mb-3">
            Still confirming
          </p>
          <h1
            className="text-3xl font-light text-[#2c2b27] mb-4 leading-tight"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            We haven't received your payment confirmation yet
          </h1>
          <p className="text-[13px] text-[#5c5447] max-w-sm leading-relaxed mb-3 tracking-wide">
            If you were charged, your order is safe. Send us your order number{" "}
            <strong className="text-[#8a7d64]">{orderNumber}</strong> on
            WhatsApp and we'll confirm it for you.
          </p>
          <button
            onClick={openWhatsApp}
            className="bg-[#25D366] text-white text-[11px] tracking-[0.18em] uppercase px-8 py-4 hover:bg-[#1ebe5d] transition-colors duration-200 mt-4 mb-4"
          >
            Message us on WhatsApp
          </button>
          <Link
            href="/"
            className="text-[11px] tracking-[0.18em] uppercase text-[#8a7d64] underline underline-offset-4"
          >
            Back to shop
          </Link>
        </>
      )}

      {state === "notfound" && (
        <>
          <p className="text-[10px] tracking-[0.22em] uppercase text-[#8a7d64] mb-3">
            Order not found
          </p>
          <p className="text-[13px] text-[#5c5447] max-w-sm leading-relaxed mb-6 tracking-wide">
            We couldn't find that order. If you just paid, message us on
            WhatsApp and we'll sort it out.
          </p>
          <Link
            href="/"
            className="text-[11px] tracking-[0.18em] uppercase text-[#8a7d64] underline underline-offset-4"
          >
            Back to shop
          </Link>
        </>
      )}
    </div>
  );
}
