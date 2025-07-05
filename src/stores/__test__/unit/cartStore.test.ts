import { useCartStore } from '../../cartStore';
import { act, renderHook } from '@testing-library/react';

jest.mock('zustand/middleware', () => ({
  persist: (fn: any) => fn,
}));

const mockProduct = {
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
};

describe('CartStore - Unit Tests', () => {
  beforeEach(() => {
    useCartStore.setState({
      items: [],
      currentUserId: null,
      userCarts: {},
    });
  });

  describe('setCurrentUser', () => {
    test('debe cambiar usuario y cargar su carrito', () => {
      const { result } = renderHook(() => useCartStore());
      
      act(() => {
        result.current.setCurrentUser('user1');
      });

      expect(result.current.currentUserId).toBe('user1');
      expect(result.current.items).toEqual([]);
    });

    test('debe guardar carrito del usuario anterior', () => {
      const { result } = renderHook(() => useCartStore());
      
      // Establecer usuario y agregar item
      act(() => {
        result.current.setCurrentUser('user1');
        result.current.addItem(mockProduct, 2);
      });

      // Cambiar a otro usuario
      act(() => {
        result.current.setCurrentUser('user2');
      });

      // Volver al primer usuario
      act(() => {
        result.current.setCurrentUser('user1');
      });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].quantity).toBe(2);
    });
  });

  describe('addItem', () => {
    beforeEach(() => {
      const { result } = renderHook(() => useCartStore());
      act(() => {
        result.current.setCurrentUser('user1');
      });
    });

    test('debe agregar nuevo producto', () => {
      const { result } = renderHook(() => useCartStore());
      
      act(() => {
        result.current.addItem(mockProduct, 2);
      });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].product.id).toBe('1');
      expect(result.current.items[0].quantity).toBe(2);
      expect(result.current.items[0].total).toBe(5.00);
    });

    test('debe incrementar cantidad si producto existe', () => {
      const { result } = renderHook(() => useCartStore());
      
      act(() => {
        result.current.addItem(mockProduct, 2);
        result.current.addItem(mockProduct, 1);
      });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].quantity).toBe(3);
      expect(result.current.items[0].total).toBe(7.50);
    });

    test('debe rechazar si excede stock', () => {
      const { result } = renderHook(() => useCartStore());
      global.alert = jest.fn();
      
      act(() => {
        result.current.addItem(mockProduct, 200); // Excede stock de 150
      });

      expect(result.current.items).toHaveLength(0);
      expect(global.alert).toHaveBeenCalledWith('Stock insuficiente. Disponible: 150');
    });
  });

  describe('updateQuantity', () => {
    test('debe actualizar cantidad correctamente', () => {
      const { result } = renderHook(() => useCartStore());
      
      act(() => {
        result.current.setCurrentUser('user1');
        result.current.addItem(mockProduct, 2);
        result.current.updateQuantity('1', 5);
      });

      expect(result.current.items[0].quantity).toBe(5);
      expect(result.current.items[0].total).toBe(12.50);
    });

    test('debe remover item si cantidad es 0', () => {
      const { result } = renderHook(() => useCartStore());
      
      act(() => {
        result.current.setCurrentUser('user1');
        result.current.addItem(mockProduct, 2);
        result.current.updateQuantity('1', 0);
      });

      expect(result.current.items).toHaveLength(0);
    });
  });

  describe('cálculos', () => {
    test('debe calcular subtotal correctamente', () => {
      const { result } = renderHook(() => useCartStore());
      
      act(() => {
        result.current.setCurrentUser('user1');
        result.current.addItem(mockProduct, 4); // 4 * 2.50 = 10.00
      });

      expect(result.current.getSubtotal()).toBe(10.00);
    });

    test('debe calcular IGV correctamente', () => {
      const { result } = renderHook(() => useCartStore());
      
      act(() => {
        result.current.setCurrentUser('user1');
        result.current.addItem(mockProduct, 4); // Subtotal: 10.00
      });

      expect(result.current.getIGVAmount()).toBe(1.80); // 18% de 10.00
    });

    test('debe calcular total correctamente', () => {
      const { result } = renderHook(() => useCartStore());
      
      act(() => {
        result.current.setCurrentUser('user1');
        result.current.addItem(mockProduct, 4); // Subtotal: 10.00, IGV: 1.80
      });

      expect(result.current.getTotal()).toBe(11.80);
    });

    test('debe redondear total para efectivo', () => {
      const { result } = renderHook(() => useCartStore());
      
      // Crear producto con precio que genere decimales
      const productWithDecimals = { ...mockProduct, salePrice: 2.47 };
      
      act(() => {
        result.current.setCurrentUser('user1');
        result.current.addItem(productWithDecimals, 1); // Total: 2.91
      });

      expect(result.current.getTotalRounded()).toBe(2.90); // Redondeado a 5 céntimos
    });
  });

  describe('clearCart', () => {
    test('debe limpiar carrito del usuario actual', () => {
      const { result } = renderHook(() => useCartStore());
      
      act(() => {
        result.current.setCurrentUser('user1');
        result.current.addItem(mockProduct, 2);
        result.current.clearCart();
      });

      expect(result.current.items).toHaveLength(0);
    });
  });
});
