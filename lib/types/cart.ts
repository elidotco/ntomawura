export type CartItem = {
  _id: string;
  name: string;
  price: number;
  image: string;
  slug: string;
  quantity: number;
};

export type CartState = {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  total: number;
  count: number;
};
