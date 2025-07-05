import { renderHook, act } from '@testing-library/react';
import { useAuthStore } from '../../authStore';
import { useCartStore } from '../../cartStore';
import { useProductStore } from '../../productStore';
import { useSalesStore } from '../../salesStore';

jest.mock('zustand/middleware', () => ({
  persist: (fn: any) => fn,
}));

describe('Refund Process E2E', () => {
  test('proceso completo de devolución parcial y completa', async () => {
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

    // FASE 1: REALIZAR VENTA ORIGINAL
    
    // Login empleado
    await act(async () => {
      await authHook.result.current.login('1001', '1234', 'TERM-001');
    });

    act(() => {
      cartHook.result.current.setCurrentUser('1');
    });

    // Agregar múltiples productos
    const product1 = productHook.result.current.products[0]; // Inca Kola
    const product2 = productHook.result.current.products[1]; // Chicha Morada

    const initialStocks = {
      product1: product1.stock,
      product2: product2.stock
    };

    act(() => {
      cartHook.result.current.addItem(product1, 5);
      cartHook.result.current.addItem(product2, 3);
    });

    // Completar venta original
    let originalSale;
    act(() => {
      originalSale = salesHook.result.current.completeSale(
        '1',
        'Juan Pérez',
        'TERM-001',
        cartHook.result.current.items,
        'card',
        new Date()
      );

      // Actualizar stock
      productHook.result.current.updateStock(product1.id, 5);
      productHook.result.current.updateStock(product2.id, 3);
    });

    expect(originalSale.status).toBe('completed');
    expect(originalSale.items).toHaveLength(2);

    // Limpiar carrito y logout empleado
    act(() => {
      cartHook.result.current.clearCart();
      authHook.result.current.logout();
    });

    // FASE 2: DEVOLUCIÓN PARCIAL

    // Login administrador
    await act(async () => {
      await authHook.result.current.login('9999', 'admin123', 'TERM-001');
    });

    // Buscar venta por ticket
    const foundSale = salesHook.result.current.getSaleByTicket(originalSale.ticketNumber);
    expect(foundSale).toBeDefined();
    expect(foundSale?.id).toBe(originalSale.id);

    // Devolución parcial: solo 2 Inca Kola de 5
    const partialRefundItems = [{
      product: product1,
      quantity: 2,
      unitPrice: product1.salePrice,
      discount: 0,
      total: product1.salePrice * 2
    }];

    let partialRefund;
    act(() => {
      partialRefund = salesHook.result.current.processRefund(
        originalSale.id,
        '3',
        'Carlos Admin',
        partialRefundItems,
        'Cliente cambió de opinión'
      );

      // Restaurar stock parcial
      productHook.result.current.restoreStock(product1.id, 2);
    });

    // Verificar devolución parcial
    expect(partialRefund).toBeDefined();
    expect(partialRefund.refundAmount).toBe(product1.salePrice * 2);
    expect(partialRefund.reason).toBe('Cliente cambió de opinión');

    // Verificar estado de venta actualizado
    const saleAfterPartialRefund = salesHook.result.current.getSaleByTicket(originalSale.ticketNumber);
    expect(saleAfterPartialRefund?.status).toBe('partial_refund');

    // Verificar stock parcialmente restaurado
    const product1AfterPartial = productHook.result.current.products.find(p => p.id === product1.id);
    expect(product1AfterPartial?.stock).toBe(initialStocks.product1 - 3); // 5 vendidos - 2 devueltos

    // FASE 3: DEVOLUCIÓN COMPLETA DEL RESTO

    // Devolver el resto: 3 Inca Kola restantes + 3 Chicha Morada
    const remainingRefundItems = [
      {
        product: product1,
        quantity: 3,
        unitPrice: product1.salePrice,
        discount: 0,
        total: product1.salePrice * 3
      },
      {
        product: product2,
        quantity: 3,
        unitPrice: product2.salePrice,
        discount: 0,
        total: product2.salePrice * 3
      }
    ];

    let finalRefund;
    act(() => {
      finalRefund = salesHook.result.current.processRefund(
        originalSale.id,
        '3',
        'Carlos Admin',
        remainingRefundItems,
        'Producto defectuoso'
      );

      // Restaurar stock restante
      productHook.result.current.restoreStock(product1.id, 3);
      productHook.result.current.restoreStock(product2.id, 3);
    });

    // Verificar devolución final
    expect(finalRefund).toBeDefined();
    expect(finalRefund.refundAmount).toBe((product1.salePrice * 3) + (product2.salePrice * 3));

    // Verificar estado final de venta
    const finalSale = salesHook.result.current.getSaleByTicket(originalSale.ticketNumber);
    expect(finalSale?.status).toBe('refunded');

    // Verificar stock completamente restaurado
    const product1Final = productHook.result.current.products.find(p => p.id === product1.id);
    const product2Final = productHook.result.current.products.find(p => p.id === product2.id);

    expect(product1Final?.stock).toBe(initialStocks.product1);
    expect(product2Final?.stock).toBe(initialStocks.product2);

    // FASE 4: VERIFICAR HISTORIAL DE DEVOLUCIONES

    const allRefunds = salesHook.result.current.getRefundsBySale(originalSale.id);
    expect(allRefunds).toHaveLength(2);

    const totalRefunded = allRefunds.reduce((sum, refund) => sum + refund.refundAmount, 0);
    expect(totalRefunded).toBeCloseTo(originalSale.total, 2);

    // Verificar que no se puede devolver más
    const saleForMoreRefunds = salesHook.result.current.getSaleByTicket(originalSale.ticketNumber);
    expect(saleForMoreRefunds?.status).toBe('refunded');

    // Logout admin
    act(() => {
      authHook.result.current.logout();
    });

    expect(authHook.result.current.isAuthenticated).toBe(false);
  });

  test('escenario de error: intento de devolución de ticket inexistente', async () => {
    const authHook = renderHook(() => useAuthStore());
    const salesHook = renderHook(() => useSalesStore());

    // Login admin
    await act(async () => {
      await authHook.result.current.login('9999', 'admin123', 'TERM-001');
    });

    // Buscar ticket inexistente
    const nonExistentSale = salesHook.result.current.getSaleByTicket('T999999999');
    expect(nonExistentSale).toBeUndefined();

    // Intentar procesar devolución de venta inexistente
    const refund = salesHook.result.current.processRefund(
      'non-existent-id',
      '3',
      'Carlos Admin',
      [],
      'Test'
    );

    expect(refund).toBe(null);
  });
});
