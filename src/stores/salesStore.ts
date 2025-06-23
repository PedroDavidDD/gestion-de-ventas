import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Sale, Refund, CartItem } from '../types';

interface SalesState {
  sales: Sale[];
  refunds: Refund[];
  completeSale: (
    employeeId: string, 
    employeeName: string, 
    terminalId: string,
    items: CartItem[], 
    paymentMethod: 'cash' | 'card',
    sessionStart: Date
  ) => Sale;
  processRefund: (
    originalSaleId: string,
    employeeId: string,
    employeeName: string,
    items: CartItem[],
    reason: string
  ) => Refund | null;
  getSaleByTicket: (ticketNumber: string) => Sale | undefined;
  getTodaySales: () => Sale[];
  getSalesByEmployee: (employeeId: string) => Sale[];
}

export const useSalesStore = create<SalesState>()(
  persist(
    (set, get) => ({
      sales: [],
      refunds: [],

      completeSale: (employeeId, employeeName, terminalId, items, paymentMethod, sessionStart) => {
        const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
        const discountAmount = items.reduce((sum, item) => sum + item.discount, 0);
        const igvAmount = (subtotal - discountAmount) * 0.18;
        const total = subtotal - discountAmount + igvAmount;
        
        const ticketNumber = `T${Date.now()}`;
        
        const sale: Sale = {
          id: Date.now().toString(),
          ticketNumber,
          employeeId,
          employeeName,
          terminalId,
          items: [...items],
          subtotal,
          igvAmount,
          discountAmount,
          total,
          paymentMethod,
          status: 'completed',
          createdAt: new Date(),
          sessionStart,
          sessionEnd: new Date()
        };

        set(state => ({
          sales: [...state.sales, sale]
        }));

        return sale;
      },

      processRefund: (originalSaleId, employeeId, employeeName, items, reason) => {
        const originalSale = get().sales.find(s => s.id === originalSaleId);
        
        if (!originalSale) {
          return null;
        }

        const refundAmount = items.reduce((sum, item) => sum + item.total, 0);
        
        const refund: Refund = {
          id: Date.now().toString(),
          originalSaleId,
          ticketNumber: originalSale.ticketNumber,
          employeeId,
          employeeName,
          items: [...items],
          refundAmount,
          reason,
          createdAt: new Date()
        };

        // Update original sale status
        set(state => ({
          sales: state.sales.map(s =>
            s.id === originalSaleId
              ? { ...s, status: 'partial_refund' as const }
              : s
          ),
          refunds: [...state.refunds, refund]
        }));

        return refund;
      },

      getSaleByTicket: (ticketNumber) => {
        return get().sales.find(s => s.ticketNumber === ticketNumber);
      },

      getTodaySales: () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        return get().sales.filter(s => s.createdAt >= today);
      },

      getSalesByEmployee: (employeeId) => {
        return get().sales.filter(s => s.employeeId === employeeId);
      }
    }),
    {
      name: 'sales-storage'
    }
  )
);