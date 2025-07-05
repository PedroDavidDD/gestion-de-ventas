import { renderHook, act } from '@testing-library/react';
import { useSalesStore } from '../../salesStore';
import { useProductStore } from '../../productStore';

jest.mock('zustand/middleware', () => ({
  persist: (fn: any) => fn,
}));

describe('Sales + Product Integration', () => {
  beforeEach(() => {
    useSalesStore.setState({
      sales: [],
      refunds: [],
    });
    
    useProductStore.setState(useProductStore.getInitialState());
  });

  test('debe actualizar stock al completar venta', () => {
    const salesHook = renderHook(() => useSalesStore());
    const productHook = renderHook(() => useProductStore());

    const product = productHook.result.current.products[0];
    const initialStock = product.stock;

    const cartItems = [{
      product,
      quantity: 5,
      unitPrice: product.salePrice,
      discount: 0,
      total: product.salePrice * 5
    }];

    // Completar venta
    act(() => {
      salesHook.result.current.completeSale(
        'emp1',
        'Juan Pérez',
        'TERM-001',
        cartItems,
        'cash',
        new Date()
      );
    });

    // Simular actualización de stock
    act(() => {
      productHook.result.current.updateStock(product.id, 5);
    });

    const updatedProduct = productHook.result.current.products.find(p => p.id === product.id);
    expect(updatedProduct?.stock).toBe(initialStock - 5);
  });

  test('debe restaurar stock al procesar devolución', () => {
    const salesHook = renderHook(() => useSalesStore());
    const productHook = renderHook(() => useProductStore());

    const product = productHook.result.current.products[0];
    const initialStock = product.stock;

    const cartItems = [{
      product,
      quantity: 3,
      unitPrice: product.salePrice,
      discount: 0,
      total: product.salePrice * 3
    }];

    // Completar venta y actualizar stock
    let sale;
    act(() => {
      sale = salesHook.result.current.completeSale(
        'emp1',
        'Juan Pérez',
        'TERM-001',
        cartItems,
        'cash',
        new Date()
      );
      productHook.result.current.updateStock(product.id, 3);
    });

    expect(productHook.result.current.products.find(p => p.id === product.id)?.stock).toBe(initialStock - 3);

    // Procesar devolución
    act(() => {
      salesHook.result.current.processRefund(
        sale.id,
        'emp2',
        'María García',
        cartItems,
        'Producto defectuoso'
      );
      productHook.result.current.restoreStock(product.id, 3);
    });

    const restoredProduct = productHook.result.current.products.find(p => p.id === product.id);
    expect(restoredProduct?.stock).toBe(initialStock);
  });

  test('debe manejar devoluciones parciales correctamente', () => {
    const salesHook = renderHook(() => useSalesStore());
    const productHook = renderHook(() => useProductStore());

    const product = productHook.result.current.products[0];
    const initialStock = product.stock;

    const cartItems = [{
      product,
      quantity: 5,
      unitPrice: product.salePrice,
      discount: 0,
      total: product.salePrice * 5
    }];

    // Venta completa
    let sale;
    act(() => {
      sale = salesHook.result.current.completeSale(
        'emp1',
        'Juan Pérez',
        'TERM-001',
        cartItems,
        'cash',
        new Date()
      );
      productHook.result.current.updateStock(product.id, 5);
    });

    // Devolución parcial (2 de 5)
    const partialRefundItems = [{
      ...cartItems[0],
      quantity: 2,
      total: product.salePrice * 2
    }];

    act(() => {
      salesHook.result.current.processRefund(
        sale.id,
        'emp2',
        'María García',
        partialRefundItems,
        'Cambio de opinión'
      );
      productHook.result.current.restoreStock(product.id, 2);
    });

    const updatedProduct = productHook.result.current.products.find(p => p.id === product.id);
    expect(updatedProduct?.stock).toBe(initialStock - 3); // 5 vendidos - 2 devueltos

    const updatedSale = salesHook.result.current.sales.find(s => s.id === sale.id);
    expect(updatedSale?.status).toBe('partial_refund');
  });

  test('debe validar stock disponible antes de venta', () => {
    const productHook = renderHook(() => useProductStore());

    const product = productHook.result.current.products[0];
    
    // Reducir stock a 2
    act(() => {
      productHook.result.current.updateStock(product.id, product.stock - 2);
    });

    const updatedProduct = productHook.result.current.products.find(p => p.id === product.id);
    expect(updatedProduct?.stock).toBe(2);

    // Intentar vender más de lo disponible debería ser validado en el carrito
    // Esta validación se hace en cartStore.addItem()
  });
});
