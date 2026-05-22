"use client";

import { useState } from "react";
import { useCart } from "@/lib/context/CartContext";

interface Product {
  _id: string;
  name: string;
  price: number;
  comparePrice?: number;
  description?: string;
  stock: number;
  slug: string;
  inStock: boolean;
  tailored?: boolean;
  tags?: string[];
  category?: string;
  images: { url: string; alt?: string }[];
}

interface Props {
  product: Product;
}

export default function ProductInfo({ product }: Props) {
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const { addItem } = useCart();

  // Tailored form state
  const [showForm, setShowForm] = useState(false);
  const [formSent, setFormSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [request, setRequest] = useState({
    name: "",
    contact: "",
    location: "",
    availability: "",
    notes: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const handleAdd = () => {
    addItem({
      _id: product._id,
      name: product.name,
      price: product.price,
      image: product.images?.[0]?.url ?? "",
      slug: product.slug,
      quantity: qty,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const validateForm = () => {
    const e: Record<string, string> = {};
    if (!request.name.trim()) e.name = "Required";
    if (!request.contact.trim()) e.contact = "Required";
    if (!request.location.trim()) e.location = "Required";
    if (!request.availability.trim()) e.availability = "Required";
    setFormErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRequestSubmit = async () => {
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      await fetch("/api/tailored-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...request, product: product.name }),
      });
      setFormSent(true);
    } catch {
      // handle silently
    } finally {
      setSubmitting(false);
    }
  };

  const discount = product.comparePrice
    ? Math.round(
        ((product.comparePrice - product.price) / product.comparePrice) * 100,
      )
    : null;

  return (
    <div className="flex flex-col px-10 py-12 gap-0">
      {/* Breadcrumb */}
      <p className="text-xs tracking-widest text-gray-400 mb-5">
        <a href="/shop" className="hover:text-black transition-colors">
          Shop
        </a>
        {product.category && (
          <>
            {" / "}
            <a
              href={`/shop?category=${product.category}`}
              className="hover:text-black transition-colors"
            >
              {product.category}
            </a>
          </>
        )}
        {" / "}
        <span className="text-gray-500">{product.name}</span>
      </p>

      {/* Name */}
      <h1 className="text-3xl font-medium tracking-tight leading-snug mb-2">
        {product.name}
      </h1>

      {/* Tailored badge */}
      {product.tailored && (
        <span className="inline-flex w-fit items-center gap-1.5 text-[10px] tracking-widest uppercase bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 rounded mb-4">
          ✦ Tailored — Measurement Required
        </span>
      )}

      {/* Price */}
      <div className="flex items-baseline gap-3 mb-5">
        <span className="text-2xl font-medium">
          {product.tailored
            ? "On Request"
            : `GH₵ ${product.price.toLocaleString()}`}
        </span>
        {product.comparePrice && (
          <>
            <span className="text-base text-gray-400 line-through">
              GH₵ {product.comparePrice.toLocaleString()}
            </span>
            <span className="text-xs bg-black text-white px-2 py-0.5 rounded">
              -{discount}%
            </span>
          </>
        )}
      </div>

      {/* Stock */}
      <div className="flex items-center gap-2 mb-6">
        {product.inStock ? (
          <>
            <div className="w-2 h-2 rounded-full bg-green-600" />
            <span className="text-xs text-green-700">
              In stock — {product.stock} available
            </span>
          </>
        ) : (
          <>
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-xs text-red-600">Out of stock</span>
          </>
        )}
      </div>

      <div className="h-px bg-gray-100 mb-6" />

      {/* Tags */}
      {product.tags && product.tags.length > 0 && (
        <div className="mb-6">
          <p className="text-xs tracking-widest text-gray-500 mb-2 font-medium">
            TAGS
          </p>
          <div className="flex flex-wrap gap-2">
            {product.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 border border-gray-200 rounded text-xs text-gray-500"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {product.tailored ? (
        /* ── Tailored CTA ── */
        <div>
          <button
            onClick={() => setShowForm((v) => !v)}
            disabled={!product.inStock}
            className={`w-full py-4 text-sm tracking-widest transition-colors rounded mb-3 ${
              product.inStock
                ? "bg-black text-white hover:bg-gray-800"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            {showForm ? "CLOSE FORM" : "MAKE A REQUEST"}
          </button>

          {/* Tailored form */}
          {showForm && !formSent && (
            <div className="border border-gray-100 rounded-lg p-6 mt-2 mb-6 bg-[#faf9f7] flex flex-col gap-5">
              <p className="text-xs tracking-widest text-gray-400 uppercase">
                Measurement Request — {product.name}
              </p>

              <div>
                <p className="text-xs tracking-widest text-gray-500 mb-1 font-medium">
                  YOUR NAME
                </p>
                <input
                  className={`w-full bg-transparent border-b pb-2 text-sm text-gray-800 placeholder-gray-300 outline-none transition-colors focus:border-black ${formErrors.name ? "border-rose-400" : "border-gray-200"}`}
                  placeholder="Ama Mensah"
                  value={request.name}
                  onChange={(e) => {
                    setRequest((r) => ({ ...r, name: e.target.value }));
                    setFormErrors((fe) => ({ ...fe, name: "" }));
                  }}
                />
                {formErrors.name && (
                  <p className="text-[10px] text-rose-400 mt-1">
                    {formErrors.name}
                  </p>
                )}
              </div>

              <div>
                <p className="text-xs tracking-widest text-gray-500 mb-1 font-medium">
                  CONTACT (PHONE / WHATSAPP)
                </p>
                <input
                  className={`w-full bg-transparent border-b pb-2 text-sm text-gray-800 placeholder-gray-300 outline-none transition-colors focus:border-black ${formErrors.contact ? "border-rose-400" : "border-gray-200"}`}
                  placeholder="+233 24 000 0000"
                  value={request.contact}
                  onChange={(e) => {
                    setRequest((r) => ({ ...r, contact: e.target.value }));
                    setFormErrors((fe) => ({ ...fe, contact: "" }));
                  }}
                />
                {formErrors.contact && (
                  <p className="text-[10px] text-rose-400 mt-1">
                    {formErrors.contact}
                  </p>
                )}
              </div>

              <div>
                <p className="text-xs tracking-widest text-gray-500 mb-1 font-medium">
                  YOUR LOCATION
                </p>
                <input
                  className={`w-full bg-transparent border-b pb-2 text-sm text-gray-800 placeholder-gray-300 outline-none transition-colors focus:border-black ${formErrors.location ? "border-rose-400" : "border-gray-200"}`}
                  placeholder="East Legon, Accra"
                  value={request.location}
                  onChange={(e) => {
                    setRequest((r) => ({ ...r, location: e.target.value }));
                    setFormErrors((fe) => ({ ...fe, location: "" }));
                  }}
                />
                {formErrors.location && (
                  <p className="text-[10px] text-rose-400 mt-1">
                    {formErrors.location}
                  </p>
                )}
              </div>

              <div>
                <p className="text-xs tracking-widest text-gray-500 mb-1 font-medium">
                  WHEN ARE YOU AVAILABLE?
                </p>
                <input
                  className={`w-full bg-transparent border-b pb-2 text-sm text-gray-800 placeholder-gray-300 outline-none transition-colors focus:border-black ${formErrors.availability ? "border-rose-400" : "border-gray-200"}`}
                  placeholder="Weekdays after 5pm, or Saturdays"
                  value={request.availability}
                  onChange={(e) => {
                    setRequest((r) => ({ ...r, availability: e.target.value }));
                    setFormErrors((fe) => ({ ...fe, availability: "" }));
                  }}
                />
                {formErrors.availability && (
                  <p className="text-[10px] text-rose-400 mt-1">
                    {formErrors.availability}
                  </p>
                )}
              </div>

              <div>
                <p className="text-xs tracking-widest text-gray-500 mb-1 font-medium">
                  ADDITIONAL NOTES (OPTIONAL)
                </p>
                <textarea
                  className="w-full bg-transparent border-b border-gray-200 pb-2 text-sm text-gray-800 placeholder-gray-300 outline-none resize-none transition-colors focus:border-black"
                  placeholder="Any specific preferences or questions…"
                  rows={3}
                  value={request.notes}
                  onChange={(e) =>
                    setRequest((r) => ({ ...r, notes: e.target.value }))
                  }
                />
              </div>

              <button
                onClick={handleRequestSubmit}
                disabled={submitting}
                className="w-full py-3.5 bg-black text-white text-xs tracking-widest hover:bg-gray-800 disabled:opacity-60 transition-colors rounded"
              >
                {submitting ? "SENDING…" : "SUBMIT REQUEST"}
              </button>
            </div>
          )}

          {/* Success */}
          {formSent && (
            <div className="border border-green-100 bg-green-50 rounded-lg p-6 mb-6 text-center">
              <p className="text-green-700 text-sm font-medium mb-1">
                ✓ Request received!
              </p>
              <p className="text-green-600 text-xs leading-relaxed">
                We'll contact you on <strong>{request.contact}</strong> to
                arrange your measurement appointment.
              </p>
            </div>
          )}
        </div>
      ) : (
        /* ── Regular Add to Cart ── */
        <>
          <div className="mb-6">
            <p className="text-xs tracking-widest text-gray-500 mb-2 font-medium">
              QUANTITY
            </p>
            <div className="flex items-center border border-gray-200 w-fit rounded">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="w-10 h-10 flex items-center justify-center text-lg text-gray-500 hover:text-black transition-colors"
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span className="w-10 h-10 flex items-center justify-center text-sm font-medium border-x border-gray-200">
                {qty}
              </span>
              <button
                onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
                className="w-10 h-10 flex items-center justify-center text-lg text-gray-500 hover:text-black transition-colors"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          </div>

          <button
            onClick={handleAdd}
            disabled={!product.inStock}
            className={`w-full py-4 text-sm tracking-widest transition-colors rounded mb-3 ${
              added
                ? "bg-green-700 text-white"
                : product.inStock
                  ? "bg-black text-white hover:bg-gray-800"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            {added
              ? "✓ ADDED TO CART"
              : product.inStock
                ? "ADD TO CART"
                : "OUT OF STOCK"}
          </button>

          <a
            href="/checkout"
            className={`w-full py-4 text-sm tracking-widest border border-gray-200 text-center rounded transition-colors mb-8 block ${
              product.inStock
                ? "hover:bg-gray-50 text-black"
                : "text-gray-300 pointer-events-none"
            }`}
          >
            BUY NOW
          </a>
        </>
      )}

      {/* Description */}
      {product.description && (
        <>
          <div className="h-px bg-gray-100 mb-6" />
          <p className="text-sm text-gray-500 leading-relaxed">
            {product.description}
          </p>
        </>
      )}
    </div>
  );
}
