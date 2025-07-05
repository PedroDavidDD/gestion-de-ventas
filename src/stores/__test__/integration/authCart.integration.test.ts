import { renderHook, act } from '@testing-library/react';
import { useAuthStore } from '../../authStore';
import { useCartStore } from '../../cartStore';

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

describe('Auth + Cart Integration', () => {
  beforeEach(() => {
    useAuthStore.setState({
      currentUser: null,
      sessions: [],
      isAuthenticated: false,
    });
    
    useCartStore.setState({
      items: [],
      currentUserId: null,
      userCarts: {},
    });
  });

  test('debe mantener carritos separados por usuario', async () => {
    const authHook = renderHook(() => useAuthStore());
    const cartHook = renderHook(() => useCartStore());

    // Usuario 1 login y agrega productos
    await act(async () => {
      await authHook.result.current.login('1001', '1234', 'TERM-001');
    });

    act(() => {
      cartHook.result.current.setCurrentUser('1');
      cartHook.result.current.addItem(mockProduct, 3);
    });

    expect(cartHook.result.current.items).toHaveLength(1);
    expect(cartHook.result.current.items[0].quantity).toBe(3);

    // Usuario 1 logout
    act(() => {
      authHook.result.current.logout();
    });

    // Usuario 2 login
    await act(async () => {
      await authHook.result.current.login('2001', '1234', 'TERM-001');
    });

    act(() => {
      cartHook.result.current.setCurrentUser('2');
    });

    // Usuario 2 debe tener carrito vacío
    expect(cartHook.result.current.items).toHaveLength(0);

    // Usuario 2 agrega productos
    act(() => {
      cartHook.result.current.addItem(mockProduct, 1);
    });

    expect(cartHook.result.current.items).toHaveLength(1);
    expect(cartHook.result.current.items[0].quantity).toBe(1);

    // Usuario 2 logout, Usuario 1 login nuevamente
    act(() => {
      authHook.result.current.logout();
    });

    await act(async () => {
      await authHook.result.current.login('1001', '1234', 'TERM-001');
    });

    act(() => {
      cartHook.result.current.setCurrentUser('1');
    });

    // Usuario 1 debe recuperar su carrito anterior
    expect(cartHook.result.current.items).toHaveLength(1);
    expect(cartHook.result.current.items[0].quantity).toBe(3);
  });

  test('debe limpiar carrito al cerrar sesión por timeout', async () => {
    const authHook = renderHook(() => useAuthStore());
    const cartHook = renderHook(() => useCartStore());

    // Login y agregar productos
    await act(async () => {
      await authHook.result.current.login('1001', '1234', 'TERM-001');
    });

    act(() => {
      cartHook.result.current.setCurrentUser('1');
      cartHook.result.current.addItem(mockProduct, 2);
    });

    expect(cartHook.result.current.items).toHaveLength(1);

    // Simular timeout
    act(() => {
      useAuthStore.setState({
        sessions: [{
          terminalId: 'TERM-001',
          employeeId: '1',
          startTime: new Date(),
          lastActivity: new Date(Date.now() - 21 * 60 * 1000), // 21 minutos atrás
          isActive: true
        }]
      });
    });

    global.alert = jest.fn();

    act(() => {
      authHook.result.current.checkSessionTimeout();
    });

    expect(authHook.result.current.isAuthenticated).toBe(false);
    expect(global.alert).toHaveBeenCalledWith('Sesión cerrada por inactividad');
  });
});
