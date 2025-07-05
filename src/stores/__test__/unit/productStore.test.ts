import { useProductStore } from '../../productStore';
import { act, renderHook } from '@testing-library/react';

jest.mock('zustand/middleware', () => ({
  persist: (fn: any) => fn,
}));

describe('ProductStore - Unit Tests', () => {
  beforeEach(() => {
    // Reset a estado inicial con productos mock
    useProductStore.setState(useProductStore.getInitialState());
  });

  describe('addProduct', () => {
    test('debe agregar nuevo producto', () => {
      const { result } = renderHook(() => useProductStore());
      
      const newProduct = {
        code: 'P999',
        barcode: '999999999',
        description: 'Producto Test',
        purchasePrice: 5.00,
        salePrice: 8.00,
        igv: 18,
        stock: 100,
        category: 'Test',
        isActive: true
      };

      act(() => {
        result.current.addProduct(newProduct);
      });

      const addedProduct = result.current.products.find(p => p.code === 'P999');
      expect(addedProduct).toBeDefined();
      expect(addedProduct?.description).toBe('Producto Test');
      expect(addedProduct?.id).toBeDefined();
      expect(addedProduct?.createdAt).toBeInstanceOf(Date);
    });

    test('debe agregar nueva categoría si no existe', () => {
      const { result } = renderHook(() => useProductStore());
      
      const initialCategories = result.current.categories.length;
      
      act(() => {
        result.current.addProduct({
          code: 'P999',
          barcode: '999999999',
          description: 'Producto Test',
          purchasePrice: 5.00,
          salePrice: 8.00,
          igv: 18,
          stock: 100,
          category: 'Nueva Categoría',
          isActive: true
        });
      });

      expect(result.current.categories).toHaveLength(initialCategories + 1);
      expect(result.current.categories).toContain('Nueva Categoría');
    });
  });

  describe('updateProduct', () => {
    test('debe actualizar producto existente', () => {
      const { result } = renderHook(() => useProductStore());
      
      const productId = result.current.products[0].id;
      
      act(() => {
        result.current.updateProduct(productId, {
          description: 'Descripción Actualizada',
          salePrice: 99.99
        });
      });

      const updatedProduct = result.current.products.find(p => p.id === productId);
      expect(updatedProduct?.description).toBe('Descripción Actualizada');
      expect(updatedProduct?.salePrice).toBe(99.99);
      expect(updatedProduct?.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('deleteProduct', () => {
    test('debe marcar producto como inactivo', () => {
      const { result } = renderHook(() => useProductStore());
      
      const productId = result.current.products[0].id;
      
      act(() => {
        result.current.deleteProduct(productId);
      });

      const deletedProduct = result.current.products.find(p => p.id === productId);
      expect(deletedProduct?.isActive).toBe(false);
    });
  });

  describe('updateStock', () => {
    test('debe reducir stock correctamente', () => {
      const { result } = renderHook(() => useProductStore());
      
      const productId = result.current.products[0].id;
      const initialStock = result.current.products[0].stock;
      
      act(() => {
        result.current.updateStock(productId, 10);
      });

      const updatedProduct = result.current.products.find(p => p.id === productId);
      expect(updatedProduct?.stock).toBe(initialStock - 10);
    });

    test('no debe permitir stock negativo', () => {
      const { result } = renderHook(() => useProductStore());
      
      const productId = result.current.products[0].id;
      
      act(() => {
        result.current.updateStock(productId, 999999);
      });

      const updatedProduct = result.current.products.find(p => p.id === productId);
      expect(updatedProduct?.stock).toBe(0);
    });
  });

  describe('restoreStock', () => {
    test('debe restaurar stock correctamente', () => {
      const { result } = renderHook(() => useProductStore());
      
      const productId = result.current.products[0].id;
      const initialStock = result.current.products[0].stock;
      
      act(() => {
        result.current.restoreStock(productId, 25);
      });

      const updatedProduct = result.current.products.find(p => p.id === productId);
      expect(updatedProduct?.stock).toBe(initialStock + 25);
    });
  });

  describe('búsquedas', () => {
    test('getProductByCode debe encontrar producto por código', () => {
      const { result } = renderHook(() => useProductStore());
      
      const product = result.current.getProductByCode('P001');
      expect(product).toBeDefined();
      expect(product?.description).toBe('Inca Kola 500ml');
    });

    test('getProductByBarcode debe encontrar producto por código de barras', () => {
      const { result } = renderHook(() => useProductStore());
      
      const product = result.current.getProductByBarcode('7501234567890');
      expect(product).toBeDefined();
      expect(product?.description).toBe('Inca Kola 500ml');
    });

    test('searchProducts debe buscar por múltiples criterios', () => {
      const { result } = renderHook(() => useProductStore());
      
      const results = result.current.searchProducts('Inca');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].description).toContain('Inca');
    });

    test('getProductsByCategory debe filtrar por categoría', () => {
      const { result } = renderHook(() => useProductStore());
      
      const bebidas = result.current.getProductsByCategory('Bebidas');
      expect(bebidas.length).toBeGreaterThan(0);
      bebidas.forEach(product => {
        expect(product.category).toBe('Bebidas');
      });
    });

    test('getLowStockProducts debe encontrar productos con stock bajo', () => {
      const { result } = renderHook(() => useProductStore());
      
      // Reducir stock de un producto
      const productId = result.current.products[0].id;
      act(() => {
        result.current.updateStock(productId, result.current.products[0].stock - 5);
      });

      const lowStockProducts = result.current.getLowStockProducts();
      expect(lowStockProducts.some(p => p.id === productId)).toBe(true);
    });
  });
});
