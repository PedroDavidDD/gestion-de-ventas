import { renderHook, act } from '@testing-library/react';
import { useAuthStore } from '../../authStore';
import { useCartStore } from '../../cartStore';
import { useProductStore } from '../../productStore';
import { useSalesStore } from '../../salesStore';

jest.mock('zustand/middleware', () => ({
  persist: (fn: any) => fn,
}));

describe('Login to Sale E2E', () => {
  test('escenario completo: empleado realiza venta exitosa', async () => {
    // Inicializar hooks
    const authHook = renderHook(() => useAuthStore());
    const cartHook = renderHook(() => useCartStore());
    const productHook = renderHook(() => useProductStore());
    const salesHook = renderHook(() => useSalesStore());

    // Reset stores
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

    // PASO 1: Empleado intenta login con credenciales incorrectas
    await act(async () => {
      const success = await authHook.result.current.login('1001', 'wrong', 'TERM-001');
      expect(success).toBe(false);
    });

    expect(authHook.result.current.isAuthenticated).toBe(false);

    // PASO 2: Empleado hace login correcto
    await act(async () => {
      const success = await authHook.result.current.login('1001', '1234', 'TERM-001');
      expect(success).toBe(true);
    });

    expect(authHook.result.current.isAuthenticated).toBe(true);
    expect(authHook.result.current.currentUser?.name).toBe('Juan Pérez');

    // PASO 3: Sistema configura carrito para usuario
    act(() => {
      cartHook.result.current.setCurrentUser('1');
    });

    expect(cartHook.result.current.currentUserId).toBe('1');
    expect(cartHook.result.current.items).toHaveLength(0);

    // PASO 4: Empleado busca y agrega productos
    const incaKola = productHook.result.current.getProductByCode('P001');
    const leche = productHook.result.current.getProductByBarcode('7501234567893');

    expect(incaKola).toBeDefined();
    expect(leche).toBeDefined();

    act(() => {
      cartHook.result.current.addItem(incaKola!, 2);
      cartHook.result.current.addItem(leche!, 1);
    });

    expect(cartHook.result.current.items).toHaveLength(2);

    // PASO 5: Empleado modifica cantidades
    act(() => {
      cartHook.result.current.updateQuantity(incaKola!.id, 3);
    });

    expect(cartHook.result.current.items[0].quantity).toBe(3);

    // PASO 6: Sistema calcula totales
    const subtotal = cartHook.result.current.getSubtotal();
    const igv = cartHook.result.current.getIGVAmount();
    const total = cartHook.result.current.getTotal();

    expect(subtotal).toBe(11.70); // 3*2.50 + 1*4.20
    expect(igv).toBeCloseTo(2.106, 2); // 18% de 11.70
    expect(total).toBeCloseTo(13.806, 2);

    // PASO 7: Empleado procesa pago
    const initialStocks = {
      incaKola: incaKola!.stock,
      leche: leche!.stock
    };

    let sale;
    act(() => {
      sale = salesHook.result.current.completeSale(
        '1',
        'Juan Pérez',
        'TERM-001',
        cartHook.result.current.items,
        'cash',
        new Date()
      );

      // Simular actualización de stock
      productHook.result.current.updateStock(incaKola!.id, 3);
      productHook.result.current.updateStock(leche!.id, 1);
    });

    // PASO 8: Verificar venta completada
    expect(sale).toBeDefined();
    expect(sale.ticketNumber).toMatch(/^T\d+$/);
    expect(sale.employeeName).toBe('Juan Pérez');
    expect(sale.terminalId).toBe('TERM-001');
    expect(sale.paymentMethod).toBe('cash');
    expect(sale.status).toBe('completed');
    expect(sale.items).toHaveLength(2);

    // PASO 9: Verificar stock actualizado
    const updatedIncaKola = productHook.result.current.getProductByCode('P001');
    const updatedLeche = productHook.result.current.getProductByBarcode('7501234567893');

    expect(updatedIncaKola?.stock).toBe(initialStocks.incaKola - 3);
    expect(updatedLeche?.stock).toBe(initialStocks.leche - 1);

    // PASO 10: Verificar carrito limpiado
    act(() => {
      cartHook.result.current.clearCart();
    });

    expect(cartHook.result.current.items).toHaveLength(0);

    // PASO 11: Verificar venta en historial
    const todaySales = salesHook.result.current.getTodaySales();
    expect(todaySales).toHaveLength(1);
    expect(todaySales[0].id).toBe(sale.id);

    // PASO 12: Empleado cierra sesión
    act(() => {
      authHook.result.current.logout();
    });

    expect(authHook.result.current.isAuthenticated).toBe(false);
    expect(authHook.result.current.currentUser).toBe(null);
  });

  test('escenario de error: stock insuficiente', async () => {
    const authHook = renderHook(() => useAuthStore());
    const cartHook = renderHook(() => useCartStore());
    const productHook = renderHook(() => useProductStore());

    // Login
    await act(async () => {
      await authHook.result.current.login('1001', '1234', 'TERM-001');
    });

    act(() => {
      cartHook.result.current.setCurrentUser('1');
    });

    // Reducir stock de un producto a 1
    const product = productHook.result.current.products[0];
    act(() => {
      productHook.result.current.updateStock(product.id, product.stock - 1);
    });

    const updatedProduct = productHook.result.current.products.find(p => p.id === product.id);
    expect(updatedProduct?.stock).toBe(1);

    // Mock alert para capturar mensaje de error
    global.alert = jest.fn();

    // Intentar agregar más stock del disponible
    act(() => {
      cartHook.result.current.addItem(updatedProduct!, 5);
    });

    expect(global.alert).toHaveBeenCalledWith('Stock insuficiente. Disponible: 1');
    expect(cartHook.result.current.items).toHaveLength(0);
  });
});
