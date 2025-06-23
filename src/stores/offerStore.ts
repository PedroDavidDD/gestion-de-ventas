import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Offer } from '../types';

interface OfferState {
  offers: Offer[];
  addOffer: (offer: Omit<Offer, 'id' | 'createdAt'>) => void;
  updateOffer: (id: string, updates: Partial<Offer>) => void;
  deleteOffer: (id: string) => void;
  getActiveOffers: () => Offer[];
  getOffersByProduct: (productId: string) => Offer[];
}

const mockOffers: Offer[] = [
  {
    id: '1',
    name: 'Inca Kola 3x2',
    description: 'Compra 3 Inca Kola y paga solo 2',
    type: 'nxm',
    productIds: ['1'], // Inca Kola
    buyQuantity: 3,
    payQuantity: 2,
    isActive: true,
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
    createdBy: '3',
    createdAt: new Date('2024-01-01')
  },
  {
    id: '2',
    name: 'Pan + Leche Gratis',
    description: 'Compra 2 panes y llévate 1 leche gratis',
    type: 'n+m',
    productIds: ['9'], // Pan Francés
    buyQuantity: 2,
    freeProductId: '4', // Leche Gloria
    freeQuantity: 1,
    isActive: true,
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
    createdBy: '3',
    createdAt: new Date('2024-01-01')
  },
  {
    id: '3',
    name: 'Papas Lay\'s 2x1',
    description: 'Compra 2 paquetes de papas y paga 1',
    type: 'nxm',
    productIds: ['11'], // Papas Lay's
    buyQuantity: 2,
    payQuantity: 1,
    isActive: true,
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
    createdBy: '3',
    createdAt: new Date('2024-01-01')
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