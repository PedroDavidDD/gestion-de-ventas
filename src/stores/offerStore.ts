import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Offer } from '../types';

interface OfferState {
  offers: Offer[];
  addOffer: (offer: Omit<Offer, 'id' | 'createdAt'>) => void;
  updateOffer: (id: string, updates: Partial<Offer>) => void;
  deleteOffer: (id: string) => void;
  getActiveOffers: () => Offer[];
  getOffersByProduct: (productId: string) => Offer[];
}

const mockOffers: Offer[] = [
  // Bebidas - nxm
  {
    id: '1',
    name: 'Inca Kola 3x2',
    description: 'Compra 3 Inca Kolás de 500ml y paga 2',
    type: 'nxm',
    productIds: ['1'], // Inca Kola
    buyQuantity: 3,
    payQuantity: 2,
    isActive: true,
    startDate: new Date('2025-04-01'),
    endDate: new Date('2025-08-28'),
    createdBy: '3', // Carlos Admin
    createdAt: new Date('2025-04-01')
  },
  {
    id: '2',
    name: 'Chicha Morada 2x1',
    description: 'Llévate 2 Chichas Moradas y paga solo 1',
    type: 'nxm',
    productIds: ['2'], // Chicha Morada Frugos 1L
    buyQuantity: 2,
    payQuantity: 1,
    isActive: true,
    startDate: new Date('2025-04-01'),
    endDate: new Date('2025-08-28'),
    createdBy: '3',
    createdAt: new Date('2025-04-01')
  },

  // Panadería - n+m (compra pan y lleva algo pequeño gratis)
  {
    id: '3',
    name: 'Pan Francés + Galleta Gratis',
    description: 'Compra 2 panes franceses y llévate 1 galleta Soda Field gratis',
    type: 'n+m',
    productIds: ['9'], // Pan Francés
    buyQuantity: 2,
    freeProductId: '20', // Galletas Soda Field
    freeQuantity: 1,
    isActive: true,
    startDate: new Date('2025-04-01'),
    endDate: new Date('2025-08-28'),
    createdBy: '3',
    createdAt: new Date('2025-04-01')
  },

  // Snacks - nxm
  {
    id: '4',
    name: 'Papas Lay\'s 4x3',
    description: 'Compra 4 paquetes de papas y paga 3',
    type: 'nxm',
    productIds: ['11'], // Papas Lay's Clásicas
    buyQuantity: 4,
    payQuantity: 3,
    isActive: true,
    startDate: new Date('2025-04-01'),
    endDate: new Date('2025-08-28'),
    createdBy: '3',
    createdAt: new Date('2025-04-01')
  },

  // Dulces - nxm
  {
    id: '5',
    name: 'Galletas Soda Field 3x2',
    description: 'Compra 3 paquetes de galletas y paga 2',
    type: 'nxm',
    productIds: ['20'], // Galletas Soda Field
    buyQuantity: 3,
    payQuantity: 2,
    isActive: true,
    startDate: new Date('2025-04-01'),
    endDate: new Date('2025-08-28'),
    createdBy: '3',
    createdAt: new Date('2025-04-01')
  },

  // Abarrotes - n+m
  {
    id: '6',
    name: 'Arroz Costeño 5+1',
    description: 'Compra 5kg de arroz y lleva 1kg extra gratis',
    type: 'n+m',
    productIds: ['6'], // Arroz Costeño
    buyQuantity: 5,
    freeProductId: '6', // Mismo producto
    freeQuantity: 1,
    isActive: true,
    startDate: new Date('2025-04-01'),
    endDate: new Date('2025-08-28'),
    createdBy: '3',
    createdAt: new Date('2025-04-01')
  },

  // Lácteos - nxm
  {
    id: '7',
    name: 'Yogurt Gloria 2x1',
    description: 'Compra 2 yogures y paga 1',
    type: 'nxm',
    productIds: ['5'], // Yogurt Gloria Fresa 1L
    buyQuantity: 2,
    payQuantity: 1,
    isActive: true,
    startDate: new Date('2025-04-01'),
    endDate: new Date('2025-08-28'),
    createdBy: '3',
    createdAt: new Date('2025-04-01')
  },

  // Conservas - nxm
  {
    id: '8',
    name: 'Atún Florida 2x1',
    description: 'Compra 2 latas de atún y paga 1',
    type: 'nxm',
    productIds: ['17'], // Atún Florida
    buyQuantity: 2,
    payQuantity: 1,
    isActive: true,
    startDate: new Date('2025-04-01'),
    endDate: new Date('2025-08-28'),
    createdBy: '3',
    createdAt: new Date('2025-04-01')
  }
];

export const useOfferStore = create<OfferState>()(
  persist(
    (set, get) => ({
      offers: mockOffers,

      addOffer: (offerData) => {
        const newOffer: Offer = {
          ...offerData,
          id: Date.now().toString(),
          createdAt: new Date()
        };

        set(state => ({
          offers: [...state.offers, newOffer]
        }));
      },

      updateOffer: (id, updates) => {
        set(state => ({
          offers: state.offers.map(o => 
            o.id === id 
              ? { ...o, ...updates }
              : o
          )
        }));
      },

      deleteOffer: (id) => {
        set(state => ({
          offers: state.offers.filter(o => o.id !== id)
        }));
      },

      getActiveOffers: () => {
        const now = new Date();
        return get().offers.filter(o => 
          o.isActive && 
          o.startDate <= now && 
          o.endDate >= now
        );
      },

      getOffersByProduct: (productId) => {
        return get().getActiveOffers().filter(o => 
          o.productIds.includes(productId)
        );
      }
    }),
    {
      name: 'offer-storage'
    }
  )
);