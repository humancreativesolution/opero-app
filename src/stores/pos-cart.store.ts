import { create } from "zustand";

import type { PosProduct } from "@/graphql/generated";

export type PosCartItem = {
  productId: string;
  sku?: string | null;
  barcode?: string | null;
  name: string;
  originalPrice: number;
  sellingPrice: number;
  discountAmount: number;
  promotionId?: string | null;
  promotionName?: string | null;
  stockOnHand: number;
  qty: number;
};

type PosCartState = {
  items: PosCartItem[];
  addProduct: (product: PosProduct) => void;
  syncProducts: (products: PosProduct[]) => void;
  setQty: (productId: string, qty: number) => void;
  increment: (productId: string) => void;
  decrement: (productId: string) => void;
  remove: (productId: string) => void;
  clear: () => void;
};

function getDisplaySellingPrice(product: PosProduct) {
  const hasDiscount =
    Boolean(product.promotionId) ||
    product.discountAmount > 0 ||
    product.sellingPrice < product.originalPrice;

  if (!hasDiscount) {
    return product.sellingPrice;
  }

  if (product.sellingPrice < product.originalPrice) {
    return product.sellingPrice;
  }

  if (product.discountAmount > 0) {
    return Math.max(0, product.originalPrice - product.discountAmount);
  }

  return product.sellingPrice;
}

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
            originalPrice: product.originalPrice,
            sellingPrice: getDisplaySellingPrice(product),
            discountAmount: product.discountAmount,
            promotionId: product.promotionId,
            promotionName: product.promotionName,
            stockOnHand: product.stockOnHand,
            qty: 1,
          },
        ],
      };
    }),
  syncProducts: (products) =>
    set((state) => {
      if (state.items.length === 0) {
        return state;
      }

      const productMap = new Map(products.map((product) => [product.id, product]));
      let hasChanges = false;

      const items = state.items.map((item) => {
        const product = productMap.get(item.productId);

        if (!product) {
          return item;
        }

        const nextItem = {
          ...item,
          originalPrice: product.originalPrice,
          sellingPrice: getDisplaySellingPrice(product),
          discountAmount: product.discountAmount,
          promotionId: product.promotionId,
          promotionName: product.promotionName,
          stockOnHand: product.stockOnHand,
        };

        if (
          nextItem.originalPrice !== item.originalPrice ||
          nextItem.sellingPrice !== item.sellingPrice ||
          nextItem.discountAmount !== item.discountAmount ||
          nextItem.promotionId !== item.promotionId ||
          nextItem.promotionName !== item.promotionName ||
          nextItem.stockOnHand !== item.stockOnHand
        ) {
          hasChanges = true;
        }

        return nextItem;
      });

      return hasChanges ? { items } : state;
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
