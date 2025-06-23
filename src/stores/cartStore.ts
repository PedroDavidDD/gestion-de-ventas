import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem, Product } from '../types';
import { useOfferStore } from './offerStore';
import { useProductStore } from './productStore';

interface CartState {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getIGVAmount: () => number;
  getDiscountAmount: () => number;
  getTotal: () => number;
  applyOffers: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product, quantity = 1) => {
        set(state => {
          const existingItem = state.items.find(item => item.product.id === product.id);
          
          if (existingItem) {
            const newQuantity = existingItem.quantity + quantity;
            if (newQuantity > product.stock) {
              alert(`Stock insuficiente. Disponible: ${product.stock}`);
              return state;
            }
            
            return {
              items: state.items.map(item =>
                item.product.id === product.id
                  ? {
                      ...item,
                      quantity: newQuantity,
                      total: newQuantity * item.unitPrice
                    }
                  : item
              )
            };
          } else {
            if (quantity > product.stock) {
              alert(`Stock insuficiente. Disponible: ${product.stock}`);
              return state;
            }
            
            const newItem: CartItem = {
              product,
              quantity,
              unitPrice: product.salePrice,
              discount: 0,
              total: product.salePrice * quantity
            };
            
            return {
              items: [...state.items, newItem]
            };
          }
        });
        
        // Apply offers after adding item
        setTimeout(() => get().applyOffers(), 0);
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }

        const item = get().items.find(i => i.product.id === productId);
        if (item && quantity > item.product.stock) {
          alert(`Stock insuficiente. Disponible: ${item.product.stock}`);
          return;
        }

        set(state => ({
          items: state.items.map(item =>
            item.product.id === productId
              ? {
                  ...item,
                  quantity,
                  total: quantity * item.unitPrice - item.discount
                }
              : item
          )
        }));

        setTimeout(() => get().applyOffers(), 0);
      },

      removeItem: (productId) => {
        set(state => ({
          items: state.items.filter(item => item.product.id !== productId)
        }));
        
        setTimeout(() => get().applyOffers(), 0);
      },

      clearCart: () => {
        set({ items: [] });
      },

      getSubtotal: () => {
        return get().items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
      },

      getDiscountAmount: () => {
        return get().items.reduce((sum, item) => sum + item.discount, 0);
      },

      getIGVAmount: () => {
        const subtotalAfterDiscount = get().getSubtotal() - get().getDiscountAmount();
        return subtotalAfterDiscount * 0.18;
      },

      getTotal: () => {
        const subtotal = get().getSubtotal();
        const discount = get().getDiscountAmount();
        const igv = get().getIGVAmount();
        return subtotal - discount + igv;
      },

      applyOffers: () => {
        const state = get();
        const offers = useOfferStore.getState().getActiveOffers();
        
        // Reset discounts
        set(prevState => ({
          items: prevState.items.map(item => ({
            ...item,
            discount: 0,
            total: item.quantity * item.unitPrice
          }))
        }));

        // Apply active offers
        offers.forEach(offer => {
          if (offer.type === 'nxm') {
            // Apply nxm offers (e.g., 3x2)
            offer.productIds.forEach(productId => {
              const item = state.items.find(i => i.product.id === productId);
              if (item && item.quantity >= offer.buyQuantity) {
                const setsOfOffer = Math.floor(item.quantity / offer.buyQuantity);
                const freeItems = setsOfOffer * (offer.buyQuantity - (offer.payQuantity || 0));
                const discount = freeItems * item.unitPrice;
                
                set(prevState => ({
                  items: prevState.items.map(i =>
                    i.product.id === productId
                      ? {
                          ...i,
                          discount,
                          total: (i.quantity * i.unitPrice) - discount
                        }
                      : i
                  )
                }));
              }
            });
          } else if (offer.type === 'n+m' && offer.freeProductId) {
            // Apply n+m offers (e.g., 2+1)
            offer.productIds.forEach(productId => {
              const item = state.items.find(i => i.product.id === productId);
              if (item && item.quantity >= offer.buyQuantity) {
                const setsOfOffer = Math.floor(item.quantity / offer.buyQuantity);
                const freeQuantity = setsOfOffer * (offer.freeQuantity || 1);
                
                // Check if free product is already in cart
                const freeItem = state.items.find(i => i.product.id === offer.freeProductId);
                if (freeItem) {
                  const discount = Math.min(freeQuantity, freeItem.quantity) * freeItem.unitPrice;
                  
                  set(prevState => ({
                    items: prevState.items.map(i =>
                      i.product.id === offer.freeProductId
                        ? {
                            ...i,
                            discount: Math.min(discount, i.total),
                            total: i.total - Math.min(discount, i.total)
                          }
                        : i
                    )
                  }));
                } else {
                  // Add free product to cart
                  const freeProduct = useProductStore.getState().products.find(p => p.id === offer.freeProductId);
                  if (freeProduct) {
                    const freeCartItem: CartItem = {
                      product: freeProduct,
                      quantity: freeQuantity,
                      unitPrice: freeProduct.salePrice,
                      discount: freeQuantity * freeProduct.salePrice,
                      total: 0
                    };
                    
                    set(prevState => ({
                      items: [...prevState.items, freeCartItem]
                    }));
                  }
                }
              }
            });
          }
        });
      }
    }),
    {
      name: 'cart-storage'
    }
  )
);