import { renderHook, act } from '@testing-library/react';
import { useCartStore } from '../../cartStore';
import { useOfferStore } from '../../offerStore';

jest.mock('zustand/middleware', () => ({
  persist: (fn: any) => fn,
}));

const mockProducts = {
  incaKola: {
    id: '1',
    code: 'P001',
    description: 'Inca Kola 500ml',
    salePrice: 2.50,
    stock: 150,
    category: 'Bebidas',
    barcode: '123456',
    purchasePrice: 1.20,
    igv: 18,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  leche: {
    id: '4',
    code: 'P004',
    description: 'Leche Gloria',
    salePrice: 4.20,
    stock: 120,
    category: 'Lácteos',
    barcode: '789012',
    purchasePrice: 2.50,
    igv: 18,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  pan: {
    id: '9',
    code: 'P009',
    description: 'Pan Francés',
    salePrice: 0.30,
    stock: 100,
    category: 'Panadería',
    barcode: '345678',
    purchasePrice: 0.15,
    igv: 18,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
};

describe('Cart + Offers Integration', () => {
  beforeEach(() => {
    useCartStore.setState({
      items: [],
      currentUserId: 'user1',
      userCarts: {},
    });
    
    // Reset offers to initial state
    useOfferStore.setState(useOfferStore.getInitialState());
  });

  test('debe aplicar oferta 3x2 automáticamente', async () => {
    const cartHook = renderHook(() => useCartStore());
    
    // Agregar 3 Inca Kola (debe activar oferta 3x2)
    act(() => {
      cartHook.result.current.addItem(mockProducts.incaKola, 3);
    });

    // Esperar a que se apliquen las ofertas
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    const item = cartHook.result.current.items[0];
    expect(item.quantity).toBe(3);
    expect(item.discount).toBe(2.50); // 1 producto gratis
    expect(item.total).toBe(5.00); // Paga solo 2
  });

  test('debe aplicar múltiples ofertas 3x2', async () => {
    const cartHook = renderHook(() => useCartStore());
    
    // Agregar 6 Inca Kola (debe activar 2 ofertas 3x2)
    act(() => {
      cartHook.result.current.addItem(mockProducts.incaKola, 6);
    });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    const item = cartHook.result.current.items[0];
    expect(item.quantity).toBe(6);
    expect(item.discount).toBe(5.00); // 2 productos gratis
    expect(item.total).toBe(10.00); // Paga solo 4
  });

  test('debe aplicar oferta 2+1 automáticamente', async () => {
    const cartHook = renderHook(() => useCartStore());
    
    // Agregar 2 panes (debe activar oferta 2+1 con leche gratis)
    act(() => {
      cartHook.result.current.addItem(mockProducts.pan, 2);
      cartHook.result.current.addItem(mockProducts.leche, 1);
    });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    const lecheItem = cartHook.result.current.items.find(i => i.product.id === '4');
    expect(lecheItem?.discount).toBe(4.20); // Leche gratis
    expect(lecheItem?.total).toBe(0);
  });

  test('debe recalcular ofertas al cambiar cantidades', async () => {
    const cartHook = renderHook(() => useCartStore());
    
    // Agregar 2 Inca Kola (sin oferta)
    act(() => {
      cartHook.result.current.addItem(mockProducts.incaKola, 2);
    });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    let item = cartHook.result.current.items[0];
    expect(item.discount).toBe(0);

    // Aumentar a 3 (debe activar oferta)
    act(() => {
      cartHook.result.current.updateQuantity('1', 3);
    });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    item = cartHook.result.current.items[0];
    expect(item.discount).toBe(2.50);
  });

  test('debe remover ofertas al quitar productos', async () => {
    const cartHook = renderHook(() => useCartStore());
    
    // Agregar 3 Inca Kola con oferta
    act(() => {
      cartHook.result.current.addItem(mockProducts.incaKola, 3);
    });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    expect(cartHook.result.current.items[0].discount).toBe(2.50);

    // Reducir a 2 (debe quitar oferta)
    act(() => {
      cartHook.result.current.updateQuantity('1', 2);
    });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    expect(cartHook.result.current.items[0].discount).toBe(0);
  });

  test('debe calcular totales correctamente con ofertas', async () => {
    const cartHook = renderHook(() => useCartStore());
    
    // Agregar productos con ofertas
    act(() => {
      cartHook.result.current.addItem(mockProducts.incaKola, 3); // 3x2
      cartHook.result.current.addItem(mockProducts.pan, 2); // 2+1
      cartHook.result.current.addItem(mockProducts.leche, 1); // Gratis por oferta
    });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    const subtotal = cartHook.result.current.getSubtotal();
    const discount = cartHook.result.current.getDiscountAmount();
    const igv = cartHook.result.current.getIGVAmount();
    const total = cartHook.result.current.getTotal();

    expect(subtotal).toBe(11.80); // 7.50 + 0.60 + 4.20
    expect(discount).toBe(6.70); // 2.50 + 4.20
    expect(igv).toBeCloseTo(0.918, 2); // 18% de (11.80 - 6.70)
    expect(total).toBeCloseTo(6.018, 2);
  });
});
