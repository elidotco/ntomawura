import { useCart } from "@/lib/context/CartContext";
import React, { use } from "react";
import { HiOutlineX } from "react-icons/hi";
import { HiMinus, HiPlus, HiShoppingBag, HiTrash } from "react-icons/hi2";

type CartProps = {
  isCartOpen: boolean;
  setIsCartOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

const Cart = ({ isCartOpen, setIsCartOpen }: CartProps) => {
  const cartItems = useCart().items;
  const cartCount = useCart()?.count || 0;
  const cartTotal = useCart().total;
  const closeAll = () => {
    setIsCartOpen(false);
  };
  const updateQty = useCart().updateQuantity;
  return (
    <aside
      aria-label="Shopping cart"
      aria-hidden={!isCartOpen}
      className={`fixed top-0 right-0 bottom-0 z-90 w-[min(400px,85vw)] bg-stone-50 flex flex-col
                    transition-transform duration-420 ease-in-out
                    ${isCartOpen ? "translate-x-0" : "translate-x-full"}`}
    >
      {/* Cart header */}
      <div className="flex items-center justify-between px-6 h-18border-b border-stone-200 shrink-0">
        <div className="flex items-center gap-2.5">
          <HiShoppingBag
            size={18}
            strokeWidth={1.5}
            className="text-stone-900"
          />
          <span
            className="font-serif font-light text-xl tracking-widest uppercase text-stone-900"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            Your Bag
          </span>
          {cartCount > 0 && (
            <span className="text-[0.65rem] tracking-wider uppercase text-stone-400">
              ({cartCount})
            </span>
          )}
        </div>
        <button
          aria-label="Close cart"
          className="p-2 text-stone-900 hover:opacity-60 transition-opacity"
          onClick={() => setIsCartOpen(false)}
        >
          <HiOutlineX size={22} strokeWidth={1.5} />
        </button>
      </div>

      {/* Cart items */}
      <div className="flex-1 overflow-y-auto py-4">
        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 px-8 text-center">
            <HiShoppingBag
              size={40}
              strokeWidth={1}
              className="text-stone-300"
            />
            <p className="text-[0.75rem] tracking-[0.14em] uppercase text-stone-400">
              Your bag is empty
            </p>
            <a
              href="/shop"
              onClick={closeAll}
              className="mt-2 text-[0.7rem] tracking-[0.16em] uppercase text-stone-900 underline underline-offset-4 hover:opacity-60 transition-opacity"
            >
              Continue Shopping
            </a>
          </div>
        ) : (
          <ul className="divide-y divide-stone-100">
            {cartItems.map((item, i) => (
              <li
                key={item.name}
                className={`px-6 py-5 flex gap-4 transition-all duration-300 ${isCartOpen ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"}`}
                style={{
                  transitionDelay: isCartOpen ? `${100 + i * 70}ms` : "0ms",
                }}
              >
                {/* Placeholder swatch */}
                <div className="w-20 h-24 bg-stone-200 rounded shrink-0 overflow-hidden">
                  <img
                    src={`${item.image}?w=80&h=100&fit=crop`}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex-1 flex flex-col justify-between min-w-0">
                  <div>
                    <p className="text-[0.8rem] tracking-wide text-stone-900 font-medium truncate">
                      {item.name}
                    </p>
                    <p className="text-[0.68rem] tracking-widest uppercase text-stone-400 mt-0.5">
                      {/* {item.variant} */}
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    {/* Qty controls */}
                    <div className="flex items-center gap-2 border border-stone-200 rounded px-1">
                      <button
                        aria-label="Decrease quantity"
                        onClick={() => updateQty(item._id, item.quantity - 1)}
                        className="p-1 text-stone-500 hover:text-stone-900 transition-colors"
                      >
                        {item.quantity === 1 ? (
                          <HiTrash size={13} strokeWidth={1.5} />
                        ) : (
                          <HiMinus size={13} strokeWidth={1.5} />
                        )}
                      </button>
                      <span className="text-[0.75rem] w-4 text-center tabular-nums text-stone-900">
                        {item.quantity}
                      </span>
                      <button
                        aria-label="Increase quantity"
                        onClick={() => updateQty(item._id, item.quantity + 1)}
                        className="p-1 text-stone-500 hover:text-stone-900 transition-colors"
                      >
                        <HiPlus size={13} strokeWidth={1.5} />
                      </button>
                    </div>

                    <p className="text-[0.82rem] tracking-wide text-stone-900">
                      GH₵ {(item.price * item.quantity).toLocaleString()}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Cart footer */}
      {cartItems.length > 0 && (
        <div className="px-6 py-6 border-t border-stone-200 shrink-0 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[0.72rem] tracking-[0.14em] uppercase text-stone-500">
              Subtotal
            </span>
            <span className="text-sm tracking-wide text-stone-900 font-medium">
              GH₵ {cartTotal.toLocaleString()}
            </span>
          </div>
          <p className="text-[0.65rem] tracking-wide text-stone-400">
            Shipping & taxes calculated at checkout
          </p>
          <a href="/checkout">
            <button
              className="w-full py-3.5 bg-stone-900 text-stone-50 text-[0.72rem] tracking-[0.2em] uppercase
                               hover:bg-stone-700 active:scale-[0.98] transition-all duration-200"
            >
              Checkout
            </button>
          </a>
          <button
            onClick={closeAll}
            className="w-full py-2.5 border border-stone-200 text-stone-500 text-[0.7rem] tracking-[0.16em] uppercase
                         hover:border-stone-900 hover:text-stone-900 transition-all duration-200"
          >
            Continue Shopping
          </button>
        </div>
      )}
    </aside>
  );
};

export default Cart;
