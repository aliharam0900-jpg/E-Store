import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  type CurrencyCode,
  DEFAULT_EXCHANGE_RATES,
} from "@/lib/utils/format";

export type { CurrencyCode };

export interface CartItem {
  product_id: string;
  variant_id: string;
  quantity: number;
  price: number;
  title: string;
  image_url: string;
  selected_size: string;
  selected_color: string;
  // Compatibility aliases
  productId?: string;
  variantId?: string;
  image?: string | null;
  size?: string | null;
  color?: string | null;
  sku?: string;
}

export interface AddItemInput {
  product_id?: string;
  variant_id?: string;
  quantity?: number;
  price: number;
  title: string;
  image_url?: string | null;
  selected_size?: string | null;
  selected_color?: string | null;
  // Compatibility properties
  productId?: string;
  variantId?: string;
  image?: string | null;
  size?: string | null;
  color?: string | null;
  sku?: string;
}

export interface AppliedDiscount {
  id?: string;
  code: string;
  type: "percentage" | "fixed";
  value: number;
}

export interface CartState {
  items: CartItem[];
  isOpen: boolean;
  appliedDiscount: AppliedDiscount | null;
  activeCurrency: CurrencyCode;
  exchangeRates: Record<CurrencyCode, number>;
  addItem: (item: AddItemInput, quantity?: number) => void;
  removeItem: (variant_id: string) => void;
  updateQuantity: (variant_id: string, quantity: number) => void;
  clearCart: () => void;
  setIsOpen: (isOpen: boolean) => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  applyDiscount: (discount: AppliedDiscount) => void;
  removeDiscount: () => void;
  setCurrency: (currency: CurrencyCode) => void;
  setExchangeRates: (rates: Partial<Record<CurrencyCode, number>>) => void;
  getRawSubtotal: () => number;
  getDiscountAmount: () => number;
  cartTotal: () => number;
  getConvertedTotal: () => number;
  getSubtotal: () => number;
  getTotalItems: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      appliedDiscount: null,
      activeCurrency: "USD",
      exchangeRates: DEFAULT_EXCHANGE_RATES,

      addItem: (itemInput, qty = 1) => {
        const product_id = itemInput.product_id || itemInput.productId || "";
        const variant_id = itemInput.variant_id || itemInput.variantId || "";
        const title = itemInput.title;
        const price = itemInput.price;
        const image_url = itemInput.image_url || itemInput.image || "";
        const selected_size = itemInput.selected_size || itemInput.size || "";
        const selected_color = itemInput.selected_color || itemInput.color || "";
        const quantity = itemInput.quantity || qty;

        const normalizedItem: CartItem = {
          product_id,
          variant_id,
          title,
          price,
          quantity,
          image_url,
          selected_size,
          selected_color,
          // Sync aliases
          productId: product_id,
          variantId: variant_id,
          image: image_url,
          size: selected_size,
          color: selected_color,
          sku: itemInput.sku,
        };

        set((state) => {
          const existingIndex = state.items.findIndex(
            (i) =>
              (i.variant_id && i.variant_id === variant_id) ||
              (i.variantId && i.variantId === variant_id)
          );

          if (existingIndex > -1) {
            const updatedItems = [...state.items];
            const currentItem = updatedItems[existingIndex];
            const newQty = currentItem.quantity + quantity;
            updatedItems[existingIndex] = {
              ...currentItem,
              quantity: newQty,
            };
            return { items: updatedItems, isOpen: true };
          }

          return {
            items: [...state.items, normalizedItem],
            isOpen: true,
          };
        });
      },

      removeItem: (variant_id: string) => {
        set((state) => ({
          items: state.items.filter(
            (i) => i.variant_id !== variant_id && i.variantId !== variant_id
          ),
        }));
      },

      updateQuantity: (variant_id: string, quantity: number) => {
        set((state) => {
          if (quantity <= 0) {
            return {
              items: state.items.filter(
                (i) => i.variant_id !== variant_id && i.variantId !== variant_id
              ),
            };
          }
          return {
            items: state.items.map((i) => {
              if (i.variant_id === variant_id || i.variantId === variant_id) {
                return { ...i, quantity };
              }
              return i;
            }),
          };
        });
      },

      clearCart: () => set({ items: [], appliedDiscount: null }),

      setIsOpen: (isOpen: boolean) => set({ isOpen }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

      applyDiscount: (discount: AppliedDiscount) => {
        set({ appliedDiscount: discount });
      },

      removeDiscount: () => {
        set({ appliedDiscount: null });
      },

      setCurrency: (activeCurrency: CurrencyCode) => set({ activeCurrency }),

      setExchangeRates: (rates) =>
        set((state) => ({
          exchangeRates: { ...state.exchangeRates, ...rates },
        })),

      getRawSubtotal: () => {
        return get().items.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        );
      },

      getDiscountAmount: () => {
        const subtotal = get().getRawSubtotal();
        const discount = get().appliedDiscount;
        if (!discount || subtotal <= 0) return 0;

        if (discount.type === "percentage") {
          return (subtotal * discount.value) / 100;
        }

        return Math.min(subtotal, discount.value);
      },

      cartTotal: () => {
        const subtotal = get().getRawSubtotal();
        const discountAmount = get().getDiscountAmount();
        return Math.max(0, subtotal - discountAmount);
      },

      getConvertedTotal: () => {
        const totalUSD = get().cartTotal();
        const currency = get().activeCurrency;
        const rate = get().exchangeRates[currency] ?? 1.0;
        return totalUSD * rate;
      },

      getSubtotal: () => {
        return get().cartTotal();
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },
    }),
    {
      name: "e_store_cart_cache",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        items: state.items,
        appliedDiscount: state.appliedDiscount,
        activeCurrency: state.activeCurrency,
      }),
    }
  )
);
