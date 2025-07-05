import { useOfferStore } from '../../offerStore';
import { act, renderHook } from '@testing-library/react';

jest.mock('zustand/middleware', () => ({
  persist: (fn: any) => fn,
}));

describe('OfferStore - Unit Tests', () => {
  beforeEach(() => {
    // Reset a estado inicial
    useOfferStore.setState(useOfferStore.getInitialState());
  });

  describe('addOffer', () => {
    test('debe agregar oferta nxm correctamente', () => {
      const { result } = renderHook(() => useOfferStore());
      
      const newOffer = {
        name: 'Test 2x1',
        description: 'Oferta de prueba',
        type: 'nxm' as const,
        productIds: ['1', '2'],
        buyQuantity: 2,
        payQuantity: 1,
        isActive: true,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdBy: 'admin'
      };

      act(() => {
        result.current.addOffer(newOffer);
      });

      const addedOffer = result.current.offers.find(o => o.name === 'Test 2x1');
      expect(addedOffer).toBeDefined();
      expect(addedOffer?.type).toBe('nxm');
      expect(addedOffer?.buyQuantity).toBe(2);
      expect(addedOffer?.payQuantity).toBe(1);
      expect(addedOffer?.id).toBeDefined();
    });

    test('debe agregar oferta n+m correctamente', () => {
      const { result } = renderHook(() => useOfferStore());
      
      const newOffer = {
        name: 'Test 2+1',
        description: 'Oferta de prueba',
        type: 'n+m' as const,
        productIds: ['1'],
        buyQuantity: 2,
        freeProductId: '2',
        freeQuantity: 1,
        isActive: true,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdBy: 'admin'
      };

      act(() => {
        result.current.addOffer(newOffer);
      });

      const addedOffer = result.current.offers.find(o => o.name === 'Test 2+1');
      expect(addedOffer).toBeDefined();
      expect(addedOffer?.type).toBe('n+m');
      expect(addedOffer?.freeProductId).toBe('2');
      expect(addedOffer?.freeQuantity).toBe(1);
    });
  });

  describe('updateOffer', () => {
    test('debe actualizar oferta existente', () => {
      const { result } = renderHook(() => useOfferStore());
      
      const offerId = result.current.offers[0].id;
      
      act(() => {
        result.current.updateOffer(offerId, {
          name: 'Oferta Actualizada',
          isActive: false
        });
      });

      const updatedOffer = result.current.offers.find(o => o.id === offerId);
      expect(updatedOffer?.name).toBe('Oferta Actualizada');
      expect(updatedOffer?.isActive).toBe(false);
    });
  });

  describe('deleteOffer', () => {
    test('debe eliminar oferta', () => {
      const { result } = renderHook(() => useOfferStore());
      
      const initialCount = result.current.offers.length;
      const offerId = result.current.offers[0].id;
      
      act(() => {
        result.current.deleteOffer(offerId);
      });

      expect(result.current.offers.length).toBe(initialCount - 1);
      expect(result.current.offers.find(o => o.id === offerId)).toBeUndefined();
    });
  });

  describe('getActiveOffers', () => {
    test('debe retornar solo ofertas activas y vigentes', () => {
      const { result } = renderHook(() => useOfferStore());
      
      // Agregar oferta expirada
      act(() => {
        result.current.addOffer({
          name: 'Oferta Expirada',
          type: 'nxm',
          productIds: ['1'],
          buyQuantity: 2,
          payQuantity: 1,
          isActive: true,
          startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 días atrás
          endDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 días atrás
          createdBy: 'admin'
        });
      });

      const activeOffers = result.current.getActiveOffers();
      
      // No debe incluir la oferta expirada
      expect(activeOffers.every(o => o.endDate >= new Date())).toBe(true);
      expect(activeOffers.every(o => o.isActive)).toBe(true);
    });

    test('debe filtrar ofertas inactivas', () => {
      const { result } = renderHook(() => useOfferStore());
      
      // Desactivar primera oferta
      const offerId = result.current.offers[0].id;
      act(() => {
        result.current.updateOffer(offerId, { isActive: false });
      });

      const activeOffers = result.current.getActiveOffers();
      expect(activeOffers.find(o => o.id === offerId)).toBeUndefined();
    });
  });

  describe('getOffersByProduct', () => {
    test('debe retornar ofertas que incluyen el producto', () => {
      const { result } = renderHook(() => useOfferStore());
      
      const offers = result.current.getOffersByProduct('1'); // Inca Kola
      
      expect(offers.length).toBeGreaterThan(0);
      offers.forEach(offer => {
        expect(offer.productIds).toContain('1');
      });
    });

    test('debe retornar array vacío para producto sin ofertas', () => {
      const { result } = renderHook(() => useOfferStore());
      
      const offers = result.current.getOffersByProduct('999');
      expect(offers).toEqual([]);
    });
  });

  describe('validaciones de fechas', () => {
    test('debe considerar ofertas que empiezan hoy', () => {
      const { result } = renderHook(() => useOfferStore());
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      act(() => {
        result.current.addOffer({
          name: 'Oferta Hoy',
          type: 'nxm',
          productIds: ['1'],
          buyQuantity: 2,
          payQuantity: 1,
          isActive: true,
          startDate: today,
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          createdBy: 'admin'
        });
      });

      const activeOffers = result.current.getActiveOffers();
      expect(activeOffers.some(o => o.name === 'Oferta Hoy')).toBe(true);
    });

    test('debe considerar ofertas que terminan hoy', () => {
      const { result } = renderHook(() => useOfferStore());
      
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      
      act(() => {
        result.current.addOffer({
          name: 'Oferta Termina Hoy',
          type: 'nxm',
          productIds: ['1'],
          buyQuantity: 2,
          payQuantity: 1,
          isActive: true,
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          endDate: today,
          createdBy: 'admin'
        });
      });

      const activeOffers = result.current.getActiveOffers();
      expect(activeOffers.some(o => o.name === 'Oferta Termina Hoy')).toBe(true);
    });
  });
});
