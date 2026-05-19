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
  console.log(product);
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

      {/* Price */}
      <div className="flex items-baseline gap-3 mb-5">
        <span className="text-2xl font-medium">
          GH₵ {product.price.toLocaleString()}
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

      {/* Quantity */}
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

      {/* Add to cart */}
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
