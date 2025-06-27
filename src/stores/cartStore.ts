import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, Product } from "../types";

interface CartState {
  items: CartItem[];
  currentUserId: string | null;
  userCarts: Record<string, CartItem[]>;
  addItem: (product: Product, quantity?: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  setCurrentUser: (userId: string) => void;
  getSubtotal: () => number;
  getIGVAmount: () => number;
  getDiscountAmount: () => number;
  getTotal: () => number;
  getTotalRounded: () => number;
  applyOffers: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      currentUserId: null,
      userCarts: {},

      setCurrentUser: (userId: string) => {
        const state = get();

        // Save current cart to user's cart if there's a current user
        if (state.currentUserId && state.items.length > 0) {
          set((prevState) => ({
            userCarts: {
              ...prevState.userCarts,
              [state.currentUserId!]: [...state.items],
            },
          }));
        }

        // Load new user's cart
        const userCart = state.userCarts[userId] || [];
        set({
          currentUserId: userId,
          items: [...userCart],
        });
      },

      addItem: (product, quantity = 1) => {
        const state = get();
        if (!state.currentUserId) return;

        const existingItem = state.items.find(
          (item) => item.product.id === product.id
        );

        if (existingItem) {
          const newQuantity = existingItem.quantity + quantity;
          if (newQuantity > product.stock) {
            alert(`Stock insuficiente. Disponible: ${product.stock}`);
            return;
          }

          set({
            items: state.items.map((item) =>
              item.product.id === product.id
                ? {
                    ...item,
                    quantity: newQuantity,
                    total: newQuantity * item.unitPrice,
                  }
                : item
            ),
          });
        } else {
          if (quantity > product.stock) {
            alert(`Stock insuficiente. Disponible: ${product.stock}`);
            return;
          }

          const newItem: CartItem = {
            product,
            quantity,
            unitPrice: product.salePrice,
            discount: 0,
            total: product.salePrice * quantity,
          };

          set({
            items: [...state.items, newItem],
          });
        }

        // Apply offers after state update
        requestAnimationFrame(() => {
          get().applyOffers();
        });
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }

        const state = get();
        const item = state.items.find((i) => i.product.id === productId);
        if (item && quantity > item.product.stock) {
          alert(`Stock insuficiente. Disponible: ${item.product.stock}`);
          return;
        }

        set({
          items: state.items.map((item) =>
            item.product.id === productId
              ? {
                  ...item,
                  quantity,
                  total: quantity * item.unitPrice - item.discount,
                }
              : item
          ),
        });

        requestAnimationFrame(() => {
          get().applyOffers();
        });
      },

      removeItem: (productId) => {
        const state = get();
        set({
          items: state.items.filter((item) => item.product.id !== productId),
        });

        requestAnimationFrame(() => {
          get().applyOffers();
        });
      },

      clearCart: () => {
        const state = get();
        if (state.currentUserId) {
          set((prevState) => ({
            items: [],
            userCarts: {
              ...prevState.userCarts,
              [state.currentUserId!]: [],
            },
          }));
        } else {
          set({ items: [] });
        }
      },

      getSubtotal: () => {
        const state = get();
        return state.items.reduce(
          (sum, item) => sum + item.quantity * item.unitPrice,
          0
        );
      },

      getDiscountAmount: () => {
        const state = get();
        return state.items.reduce((sum, item) => sum + item.discount, 0);
      },

      getIGVAmount: () => {
        const subtotalAfterDiscount =
          get().getSubtotal() - get().getDiscountAmount();
        return subtotalAfterDiscount * 0.18;
      },

      getTotal: () => {
        const subtotal = get().getSubtotal();
        const discount = get().getDiscountAmount();
        const igv = get().getIGVAmount();
        return subtotal - discount + igv;
      },

      getTotalRounded: () => {
        const total = get().getTotal();
        return Math.round(total * 10) / 10; // Redondeo al múltiplo más cercano de 0.10
      },

      applyOffers: () => {
        const state = get();

        // Import offers store dynamically to avoid circular dependency
        import("./offerStore").then(({ useOfferStore }) => {
          const offers = useOfferStore.getState().getActiveOffers();

          // Reset discounts first
          const itemsWithoutDiscounts = state.items.map((item) => ({
            ...item,
            discount: 0,
            total: item.quantity * item.unitPrice,
          }));

          const updatedItems = [...itemsWithoutDiscounts];

          // Apply active offers
          offers.forEach((offer) => {
            if (offer.type === "nxm") {
              // Apply nxm offers (e.g., 3x2)
              offer.productIds.forEach((productId) => {
                const itemIndex = updatedItems.findIndex(
                  (i) => i.product.id === productId
                );
                if (itemIndex >= 0) {
                  const item = updatedItems[itemIndex];
                  if (item.quantity >= offer.buyQuantity) {
                    const setsOfOffer = Math.floor(
                      item.quantity / offer.buyQuantity
                    );
                    const freeItems =
                      setsOfOffer *
                      (offer.buyQuantity - (offer.payQuantity || 0));
                    const discount = freeItems * item.unitPrice;

                    updatedItems[itemIndex] = {
                      ...item,
                      discount,
                      total: item.quantity * item.unitPrice - discount,
                    };
                  }
                }
              });
            } else if (offer.type === "n+m" && offer.freeProductId) {
              // Apply n+m offers (e.g., 2+1)
              offer.productIds.forEach((productId) => {
                const item = updatedItems.find(
                  (i) => i.product.id === productId
                );
                if (item && item.quantity >= offer.buyQuantity) {
                  const setsOfOffer = Math.floor(
                    item.quantity / offer.buyQuantity
                  );
                  const freeQuantity = setsOfOffer * (offer.freeQuantity || 1);

                  // Check if free product is already in cart
                  const freeItemIndex = updatedItems.findIndex(
                    (i) => i.product.id === offer.freeProductId
                  );
                  if (freeItemIndex >= 0) {
                    const freeItem = updatedItems[freeItemIndex];
                    const discount =
                      Math.min(freeQuantity, freeItem.quantity) *
                      freeItem.unitPrice;

                    updatedItems[freeItemIndex] = {
                      ...freeItem,
                      discount: Math.min(discount, freeItem.total),
                      total:
                        freeItem.total - Math.min(discount, freeItem.total),
                    };
                  } else {
                    // Add free product to cart
                    import("./productStore").then(({ useProductStore }) => {
                      const freeProduct = useProductStore
                        .getState()
                        .products.find((p) => p.id === offer.freeProductId);
                      if (freeProduct) {
                        const freeCartItem: CartItem = {
                          product: freeProduct,
                          quantity: freeQuantity,
                          unitPrice: freeProduct.salePrice,
                          discount: freeQuantity * freeProduct.salePrice,
                          total: 0,
                        };

                        updatedItems.push(freeCartItem);
                      }
                    });
                  }
                }
              });
            }
          });

          // Update state with new items
          set({ items: updatedItems });
        });
      },
    }),
    {
      name: "cart-storage",
    }
  )
);
