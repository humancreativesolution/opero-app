import { create } from "zustand";

import type { PosProduct } from "@/graphql/generated";

export type PosCartItem = {
  productId: string;
  sku?: string | null;
  barcode?: string | null;
  name: string;
  sellingPrice: number;
  stockOnHand: number;
  qty: number;
};

type PosCartState = {
  items: PosCartItem[];
  addProduct: (product: PosProduct) => void;
  setQty: (productId: string, qty: number) => void;
  increment: (productId: string) => void;
  decrement: (productId: string) => void;
  remove: (productId: string) => void;
  clear: () => void;
};

export const usePosCartStore = create<PosCartState>((set) => ({
  items: [],
  addProduct: (product) =>
    set((state) => {
      const existingItem = state.items.find((item) => item.productId === product.id);

      if (existingItem) {
        return {
          items: state.items.map((item) =>
            item.productId === product.id
              ? { ...item, qty: Math.min(item.stockOnHand, item.qty + 1) }
              : item,
          ),
        };
      }

      return {
        items: [
          ...state.items,
          {
            productId: product.id,
            sku: product.sku,
            barcode: product.barcode,
            name: product.name,
            sellingPrice: product.sellingPrice,
            stockOnHand: product.stockOnHand,
            qty: 1,
          },
        ],
      };
    }),
  setQty: (productId, qty) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.productId === productId
          ? {
              ...item,
              qty: Math.min(item.stockOnHand, Math.max(1, Math.floor(qty || 1))),
            }
          : item,
      ),
    })),
  increment: (productId) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.productId === productId
          ? { ...item, qty: Math.min(item.stockOnHand, item.qty + 1) }
          : item,
      ),
    })),
  decrement: (productId) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.productId === productId
          ? { ...item, qty: Math.max(1, item.qty - 1) }
          : item,
      ),
    })),
  remove: (productId) =>
    set((state) => ({
      items: state.items.filter((item) => item.productId !== productId),
    })),
  clear: () => set({ items: [] }),
}));
