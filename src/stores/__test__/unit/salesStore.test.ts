import { useSalesStore } from '../../salesStore';
import { act, renderHook } from '@testing-library/react';

jest.mock('zustand/middleware', () => ({
  persist: (fn: any) => fn,
}));

const mockCartItems = [
  {
    product: {
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
    quantity: 2,
    unitPrice: 2.50,
    discount: 0,
    total: 5.00
  }
];

describe('SalesStore - Unit Tests', () => {
  beforeEach(() => {
    useSalesStore.setState({
      sales: [],
      refunds: [],
    });
  });

  describe('completeSale', () => {
    test('debe completar venta correctamente', () => {
      const { result } = renderHook(() => useSalesStore());
      
      let sale;
      act(() => {
        sale = result.current.completeSale(
          'emp1',
          'Juan Pérez',
          'TERM-001',
          mockCartItems,
          'cash',
          new Date()
        );
      });

      expect(sale).toBeDefined();
      expect(sale.employeeName).toBe('Juan Pérez');
      expect(sale.terminalId).toBe('TERM-001');
      expect(sale.paymentMethod).toBe('cash');
      expect(sale.status).toBe('completed');
      expect(sale.subtotal).toBe(5.00);
      expect(sale.igvAmount).toBe(0.90); // 18% de 5.00
      expect(sale.total).toBe(5.90);
      expect(sale.ticketNumber).toMatch(/^T\d+$/);
    });

    test('debe generar número de ticket único', () => {
      const { result } = renderHook(() => useSalesStore());
      
      let sale1, sale2;
      act(() => {
        sale1 = result.current.completeSale('emp1', 'Juan', 'TERM-001', mockCartItems, 'cash', new Date());
        sale2 = result.current.completeSale('emp1', 'Juan', 'TERM-001', mockCartItems, 'card', new Date());
      });

      expect(sale1.ticketNumber).not.toBe(sale2.ticketNumber);
    });

    test('debe calcular totales con descuentos', () => {
      const { result } = renderHook(() => useSalesStore());
      
      const itemsWithDiscount = [{
        ...mockCartItems[0],
        discount: 1.00,
        total: 4.00
      }];

      let sale;
      act(() => {
        sale = result.current.completeSale(
          'emp1',
          'Juan Pérez',
          'TERM-001',
          itemsWithDiscount,
          'cash',
          new Date()
        );
      });

      expect(sale.subtotal).toBe(5.00); // Precio original
      expect(sale.discountAmount).toBe(1.00);
      expect(sale.igvAmount).toBe(0.72); // 18% de (5.00 - 1.00)
      expect(sale.total).toBe(4.72);
    });
  });

  describe('processRefund', () => {
    test('debe procesar devolución correctamente', () => {
      const { result } = renderHook(() => useSalesStore());
      
      // Crear venta primero
      let sale;
      act(() => {
        sale = result.current.completeSale(
          'emp1',
          'Juan Pérez',
          'TERM-001',
          mockCartItems,
          'cash',
          new Date()
        );
      });

      // Procesar devolución
      let refund;
      act(() => {
        refund = result.current.processRefund(
          sale.id,
          'emp2',
          'María García',
          mockCartItems,
          'Producto defectuoso'
        );
      });

      expect(refund).toBeDefined();
      expect(refund.originalSaleId).toBe(sale.id);
      expect(refund.employeeName).toBe('María García');
      expect(refund.reason).toBe('Producto defectuoso');
      expect(refund.refundAmount).toBe(5.00);
    });

    test('debe actualizar estado de venta a devolución parcial', () => {
      const { result } = renderHook(() => useSalesStore());
      
      // Crear venta
      let sale;
      act(() => {
        sale = result.current.completeSale(
          'emp1',
          'Juan Pérez',
          'TERM-001',
          mockCartItems,
          'cash',
          new Date()
        );
      });

      // Devolución parcial (menos del total)
      const partialItems = [{
        ...mockCartItems[0],
        quantity: 1,
        total: 2.50
      }];

      act(() => {
        result.current.processRefund(
          sale.id,
          'emp2',
          'María García',
          partialItems,
          'Cambio de opinión'
        );
      });

      const updatedSale = result.current.sales.find(s => s.id === sale.id);
      expect(updatedSale?.status).toBe('partial_refund');
    });

    test('debe actualizar estado a devuelto completo', () => {
      const { result } = renderHook(() => useSalesStore());
      
      // Crear venta
      let sale;
      act(() => {
        sale = result.current.completeSale(
          'emp1',
          'Juan Pérez',
          'TERM-001',
          mockCartItems,
          'cash',
          new Date()
        );
      });

      // Devolución completa
      act(() => {
        result.current.processRefund(
          sale.id,
          'emp2',
          'María García',
          mockCartItems,
          'Producto defectuoso'
        );
      });

      const updatedSale = result.current.sales.find(s => s.id === sale.id);
      expect(updatedSale?.status).toBe('refunded');
    });
  });

  describe('búsquedas', () => {
    test('getSaleByTicket debe encontrar venta por ticket', () => {
      const { result } = renderHook(() => useSalesStore());
      
      let sale;
      act(() => {
        sale = result.current.completeSale(
          'emp1',
          'Juan Pérez',
          'TERM-001',
          mockCartItems,
          'cash',
          new Date()
        );
      });

      const foundSale = result.current.getSaleByTicket(sale.ticketNumber);
      expect(foundSale).toBeDefined();
      expect(foundSale?.id).toBe(sale.id);
    });

    test('getTodaySales debe filtrar ventas de hoy', () => {
      const { result } = renderHook(() => useSalesStore());
      
      act(() => {
        result.current.completeSale('emp1', 'Juan', 'TERM-001', mockCartItems, 'cash', new Date());
      });

      const todaySales = result.current.getTodaySales();
      expect(todaySales.length).toBe(1);
    });

    test('getSalesByEmployee debe filtrar por empleado', () => {
      const { result } = renderHook(() => useSalesStore());
      
      act(() => {
        result.current.completeSale('emp1', 'Juan', 'TERM-001', mockCartItems, 'cash', new Date());
        result.current.completeSale('emp2', 'María', 'TERM-002', mockCartItems, 'card', new Date());
      });

      const emp1Sales = result.current.getSalesByEmployee('emp1');
      expect(emp1Sales.length).toBe(1);
      expect(emp1Sales[0].employeeId).toBe('emp1');
    });

    test('getRefundsBySale debe obtener devoluciones de una venta', () => {
      const { result } = renderHook(() => useSalesStore());
      
      // Crear venta y devolución
      let sale;
      act(() => {
        sale = result.current.completeSale('emp1', 'Juan', 'TERM-001', mockCartItems, 'cash', new Date());
        result.current.processRefund(sale.id, 'emp2', 'María', mockCartItems, 'Test');
      });

      const refunds = result.current.getRefundsBySale(sale.id);
      expect(refunds.length).toBe(1);
      expect(refunds[0].originalSaleId).toBe(sale.id);
    });
  });
});
