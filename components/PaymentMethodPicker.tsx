type PaymentMethod = "delivery" | "instant";

const PAYMENT_OPTIONS: {
  value: PaymentMethod;
  title: string;
  description: string;
}[] = [
  {
    value: "instant",
    title: "Instant Payment",
    description:
      "Pay now with card or mobile money. Your order is confirmed immediately.",
  },
  {
    value: "delivery",
    title: "Payment on Delivery",
    description:
      "Pay when your fabrics arrive. No card or mobile money needed upfront.",
  },
];

export default function PaymentMethodPicker() {
  return (
    <fieldset className="mb-10 space-y-3">
      <legend className="sr-only">Payment method</legend>
      {PAYMENT_OPTIONS.map((option) => (
        <label
          key={option.value}
          className="flex cursor-pointer items-start gap-4 border border-[#d6cfbd] p-4 transition-colors hover:border-[#b5a98a] has-[:checked]:border-[#8a7d64] has-[:checked]:bg-[#eee9de] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#8a7d64]"
        >
          <input
            type="radio"
            name="paymentMethod"
            value={option.value}
            defaultChecked={option.value === "instant"}
            className="peer sr-only"
          />
          <span className="mt-0.5 flex h-4.5 w-4.5 px-auto items-center justify-center rounded-full border border-[#8a7d64] peer-checked:[&>span]:opacity-100">
            <span className="h-2.5 w-2.5 mx-auto mx-1 my-1 rounded-full bg-[#8a7d64] opacity-0 transition-opacity" />
          </span>
          <div>
            <p className="mb-1 text-[13px] tracking-wide text-[#2c2b27]">
              {option.title}
            </p>
            <p className="text-[11px] leading-relaxed text-[#8a7d64]">
              {option.description}
            </p>
          </div>
        </label>
      ))}
    </fieldset>
  );
}
