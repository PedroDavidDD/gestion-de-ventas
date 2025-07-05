import { renderHook, act } from '@testing-library/react';
import { useAuthStore } from '../../authStore';
import { useCartStore } from '../../cartStore';
import { useProductStore } from '../../productStore';
import { useSalesStore } from '../../salesStore';
import { useOfferStore } from '../../offerStore';

jest.mock('zustand/middleware', () => ({
  persist: (fn: any) => fn,
}));

describe('Full Workflow Integration', () => {
  let authHook: any;
  let cartHook: any;
  let productHook: any;
  let salesHook: any;
  let offerHook: any;

  beforeEach(() => {
    // Reset all stores
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
    
    useProductStore.setState(useProductStore.getInitialState());
    useSalesStore.setState({ sales: [], refunds: [] });
    useOfferStore.setState(useOfferStore.getInitialState());

    authHook = renderHook(() => useAuthStore());
    cartHook = renderHook(() => useCartStore());
    productHook = renderHook(() => useProductStore());
    salesHook = renderHook(() => useSalesStore());
    offerHook = renderHook(() => useOfferStore());
  });

  test('flujo completo: login → agregar productos → aplicar ofertas → venta → logout', async () => {
    // 1. Login
    await act(async () => {
      const success = await authHook.result.current.login('1001', '1234', 'TERM-001');
      expect(success).toBe(true);
    });

    expect(authHook.result.current.isAuthenticated).toBe(true);

    // 2. Configurar carrito para usuario
    act(() => {
      cartHook.result.current.setCurrentUser('1');
    });

    // 3. Agregar productos (activar oferta 3x2 de Inca Kola)
    const incaKola = productHook.result.current.getProductByCode('P001');
    expect(incaKola).toBeDefined();

    act(() => {
      cartHook.result.current.addItem(incaKola!, 3);
    });

    // Esperar aplicación de ofertas
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    // 4. Verificar oferta aplicada
    expect(cartHook.result.current.items).toHaveLength(1);
    expect(cartHook.result.current.items[0].discount).toBe(2.50); // 1 gratis
    expect(cartHook.result.current.getDiscountAmount()).toBe(2.50);

    // 5. Completar venta
    const initialStock = incaKola!.stock;
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
    });

    // 6. Verificar venta registrada
    expect(sale).toBeDefined();
    expect(sale.discountAmount).toBe(2.50);
    expect(sale.status).toBe('completed');
    expect(salesHook.result.current.sales).toHaveLength(1);

    // 7. Verificar stock actualizado
    const updatedProduct = productHook.result.current.getProductByCode('P001');
    expect(updatedProduct?.stock).toBe(initialStock - 3);

    // 8. Limpiar carrito
    act(() => {
      cartHook.result.current.clearCart();
    });

    expect(cartHook.result.current.items).toHaveLength(0);

    // 9. Logout
    act(() => {
      authHook.result.current.logout();
    });

    expect(authHook.result.current.isAuthenticated).toBe(false);
  });

  test('flujo de devolución completa', async () => {
    // Setup: Login y venta inicial
    await act(async () => {
      await authHook.result.current.login('1001', '1234', 'TERM-001');
    });

    act(() => {
      cartHook.result.current.setCurrentUser('1');
    });

    const product = productHook.result.current.products[0];
    const initialStock = product.stock;

    const cartItems = [{
      product,
      quantity: 2,
      unitPrice: product.salePrice,
      discount: 0,
      total: product.salePrice * 2
    }];

    let sale;
    act(() => {
      sale = salesHook.result.current.completeSale(
        '1',
        'Juan Pérez',
        'TERM-001',
        cartItems,
        'card',
        new Date()
      );
      productHook.result.current.updateStock(product.id, 2);
    });

    // Logout empleado, login admin para devolución
    act(() => {
      authHook.result.current.logout();
    });

    await act(async () => {
      await authHook.result.current.login('9999', 'admin123', 'TERM-001');
    });

    // Procesar devolución
    act(() => {
      salesHook.result.current.processRefund(
        sale.id,
        '3',
        'Carlos Admin',
        cartItems,
        'Producto defectuoso'
      );
      productHook.result.current.restoreStock(product.id, 2);
    });

    // Verificar devolución
    const refunds = salesHook.result.current.getRefundsBySale(sale.id);
    expect(refunds).toHaveLength(1);
    expect(refunds[0].refundAmount).toBe(product.salePrice * 2);

    const updatedSale = salesHook.result.current.getSaleByTicket(sale.ticketNumber);
    expect(updatedSale?.status).toBe('refunded');

    const restoredProduct = productHook.result.current.products.find(p => p.id === product.id);
    expect(restoredProduct?.stock).toBe(initialStock);
  });

  test('flujo con múltiples usuarios y carritos independientes', async () => {
    // Usuario 1 login y agrega productos
    await act(async () => {
      await authHook.result.current.login('1001', '1234', 'TERM-001');
    });

    act(() => {
      cartHook.result.current.setCurrentUser('1');
      cartHook.result.current.addItem(productHook.result.current.products[0], 2);
    });

    expect(cartHook.result.current.items).toHaveLength(1);

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

    // Usuario 2 tiene carrito vacío
    expect(cartHook.result.current.items).toHaveLength(0);

    // Usuario 2 agrega diferentes productos
    act(() => {
      cartHook.result.current.addItem(productHook.result.current.products[1], 1);
    });

    expect(cartHook.result.current.items).toHaveLength(1);
    expect(cartHook.result.current.items[0].product.id).toBe(productHook.result.current.products[1].id);

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

    // Usuario 1 recupera su carrito original
    expect(cartHook.result.current.items).toHaveLength(1);
    expect(cartHook.result.current.items[0].product.id).toBe(productHook.result.current.products[0].id);
    expect(cartHook.result.current.items[0].quantity).toBe(2);
  });
});
