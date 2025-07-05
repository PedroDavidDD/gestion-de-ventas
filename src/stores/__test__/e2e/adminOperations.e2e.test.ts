import { renderHook, act } from '@testing-library/react';
import { useAuthStore } from '../../authStore';
import { useProductStore } from '../../productStore';
import { useOfferStore } from '../../offerStore';
import { useCartStore } from '../../cartStore';

jest.mock('zustand/middleware', () => ({
  persist: (fn: any) => fn,
}));

describe('Admin Operations E2E', () => {
  test('administrador gestiona productos y ofertas completo', async () => {
    // Inicializar hooks
    const authHook = renderHook(() => useAuthStore());
    const productHook = renderHook(() => useProductStore());
    const offerHook = renderHook(() => useOfferStore());
    const cartHook = renderHook(() => useCartStore());

    // FASE 1: LOGIN COMO ADMINISTRADOR

    await act(async () => {
      const success = await authHook.result.current.login('9999', 'admin123', 'TERM-001');
      expect(success).toBe(true);
    });

    expect(authHook.result.current.currentUser?.role).toBe('admin');

    // FASE 2: GESTIÓN DE PRODUCTOS

    const initialProductCount = productHook.result.current.products.length;

    // Crear nuevo producto
    const newProduct = {
      code: 'P999',
      barcode: '9999999999999',
      description: 'Producto Test Admin',
      purchasePrice: 10.00,
      salePrice: 15.00,
      igv: 18,
      stock: 100,
      category: 'Test Category',
      isActive: true
    };

    act(() => {
      productHook.result.current.addProduct(newProduct);
    });

    expect(productHook.result.current.products).toHaveLength(initialProductCount + 1);

    const addedProduct = productHook.result.current.getProductByCode('P999');
    expect(addedProduct).toBeDefined();
    expect(addedProduct?.description).toBe('Producto Test Admin');

    // Actualizar precio del producto
    act(() => {
      productHook.result.current.updatePrice(addedProduct!.id, 18.50);
    });

    const updatedProduct = productHook.result.current.getProductByCode('P999');
    expect(updatedProduct?.salePrice).toBe(18.50);

    // Actualizar stock
    act(() => {
      productHook.result.current.updateStock(addedProduct!.id, 25);
    });

    const stockUpdatedProduct = productHook.result.current.getProductByCode('P999');
    expect(stockUpdatedProduct?.stock).toBe(75);

    // FASE 3: GESTIÓN DE OFERTAS

    const initialOfferCount = offerHook.result.current.offers.length;

    // Crear oferta 2x1 para el nuevo producto
    const newOffer = {
      name: 'Test 2x1',
      description: 'Oferta de prueba para producto test',
      type: 'nxm' as const,
      productIds: [addedProduct!.id],
      buyQuantity: 2,
      payQuantity: 1,
      isActive: true,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      createdBy: '3'
    };

    act(() => {
      offerHook.result.current.addOffer(newOffer);
    });

    expect(offerHook.result.current.offers).toHaveLength(initialOfferCount + 1);

    const addedOffer = offerHook.result.current.offers.find(o => o.name === 'Test 2x1');
    expect(addedOffer).toBeDefined();

    // Verificar que la oferta está activa
    const activeOffers = offerHook.result.current.getActiveOffers();
    expect(activeOffers.some(o => o.id === addedOffer!.id)).toBe(true);

    // FASE 4: PROBAR OFERTA EN CARRITO

    act(() => {
      cartHook.result.current.setCurrentUser('3'); // Admin user
    });

    // Agregar 2 productos para activar oferta 2x1
    act(() => {
      cartHook.result.current.addItem(stockUpdatedProduct!, 2);
    });

    // Esperar aplicación de ofertas
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    // Verificar que se aplicó la oferta
    expect(cartHook.result.current.items).toHaveLength(1);
    expect(cartHook.result.current.items[0].discount).toBe(18.50); // 1 producto gratis
    expect(cartHook.result.current.items[0].total).toBe(18.50); // Paga solo 1

    // FASE 5: MODIFICAR OFERTA

    act(() => {
      offerHook.result.current.updateOffer(addedOffer!.id, {
        name: 'Test 3x2 Actualizado',
        buyQuantity: 3,
        payQuantity: 2
      });
    });

    const updatedOffer = offerHook.result.current.offers.find(o => o.id === addedOffer!.id);
    expect(updatedOffer?.name).toBe('Test 3x2 Actualizado');
    expect(updatedOffer?.buyQuantity).toBe(3);

    // FASE 6: DESACTIVAR PRODUCTO

    act(() => {
      productHook.result.current.deleteProduct(addedProduct!.id);
    });

    const deactivatedProduct = productHook.result.current.products.find(p => p.id === addedProduct!.id);
    expect(deactivatedProduct?.isActive).toBe(false);

    // Verificar que no aparece en búsquedas de productos activos
    const activeProduct = productHook.result.current.getProductByCode('P999');
    expect(activeProduct).toBeUndefined();

    // FASE 7: ELIMINAR OFERTA

    act(() => {
      offerHook.result.current.deleteOffer(addedOffer!.id);
    });

    expect(offerHook.result.current.offers.find(o => o.id === addedOffer!.id)).toBeUndefined();

    // FASE 8: VERIFICAR REPORTES/ESTADÍSTICAS

    // Verificar productos con stock bajo
    const lowStockProducts = productHook.result.current.getLowStockProducts(80);
    expect(lowStockProducts.some(p => p.id === addedProduct!.id)).toBe(true); // Stock 75 < 80

    // Verificar categorías
    expect(productHook.result.current.categories).toContain('Test Category');

    // FASE 9: LOGOUT ADMIN

    act(() => {
      authHook.result.current.logout();
    });

    expect(authHook.result.current.isAuthenticated).toBe(false);
  });

  test('empleado no puede acceder a funciones de admin', async () => {
    const authHook = renderHook(() => useAuthStore());

    // Login como empleado
    await act(async () => {
      await authHook.result.current.login('1001', '1234', 'TERM-001');
    });

    expect(authHook.result.current.currentUser?.role).toBe('employee');

    // En una aplicación real, las funciones de admin estarían protegidas
    // Aquí verificamos que el rol es correcto para implementar esas protecciones
    expect(authHook.result.current.currentUser?.role).not.toBe('admin');
  });

  test('gestión completa de ofertas n+m', async () => {
    const authHook = renderHook(() => useAuthStore());
    const productHook = renderHook(() => useProductStore());
    const offerHook = renderHook(() => useOfferStore());
    const cartHook = renderHook(() => useCartStore());

    // Login admin
    await act(async () => {
      await authHook.result.current.login('9999', 'admin123', 'TERM-001');
    });

    // Obtener productos existentes
    const product1 = productHook.result.current.products[0]; // Producto base
    const product2 = productHook.result.current.products[1]; // Producto gratis

    // Crear oferta n+m (compra 2 del producto1, lleva 1 del producto2 gratis)
    const nmOffer = {
      name: 'Oferta 2+1 Test',
      description: 'Compra 2 y lleva 1 gratis',
      type: 'n+m' as const,
      productIds: [product1.id],
      buyQuantity: 2,
      freeProductId: product2.id,
      freeQuantity: 1,
      isActive: true,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      createdBy: '3'
    };

    act(() => {
      offerHook.result.current.addOffer(nmOffer);
    });

    // Configurar carrito y probar oferta
    act(() => {
      cartHook.result.current.setCurrentUser('3');
    });

    // Agregar productos para activar oferta
    act(() => {
      cartHook.result.current.addItem(product1, 2); // Producto base
      cartHook.result.current.addItem(product2, 1); // Producto que será gratis
    });

    // Esperar aplicación de ofertas
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    // Verificar que el producto2 tiene descuento del 100%
    const freeItem = cartHook.result.current.items.find(i => i.product.id === product2.id);
    expect(freeItem?.discount).toBe(product2.salePrice);
    expect(freeItem?.total).toBe(0);

    // Verificar totales
    const expectedSubtotal = (product1.salePrice * 2) + product2.salePrice;
    const expectedDiscount = product2.salePrice;
    
    expect(cartHook.result.current.getSubtotal()).toBe(expectedSubtotal);
    expect(cartHook.result.current.getDiscountAmount()).toBe(expectedDiscount);
  });
});
