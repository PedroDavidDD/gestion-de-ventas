import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product } from '../types';

interface ProductState {
  products: Product[];
  categories: string[];
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  updatePrice: (id: string, newPrice: number) => void;
  updateStock: (id: string, quantity: number) => void;
  restoreStock: (id: string, quantity: number) => void;
  getProductByCode: (code: string) => Product | undefined;
  getProductByBarcode: (barcode: string) => Product | undefined;
  searchProducts: (query: string) => Product[];
  getProductsByCategory: (category: string) => Product[];
  getLowStockProducts: (threshold?: number) => Product[];
}

// Productos locales peruanos
const mockProducts: Product[] = [
  // Bebidas
  {
    id: '1',
    code: 'P001',
    barcode: '7501234567890',
    description: 'Inca Kola 500ml',
    purchasePrice: 1.20,
    salePrice: 2.50,
    igv: 18,
    stock: 150,
    category: 'Bebidas',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: '2',
    code: 'P002',
    barcode: '7501234567891',
    description: 'Chicha Morada Frugos 1L',
    purchasePrice: 2.80,
    salePrice: 4.50,
    igv: 18,
    stock: 80,
    category: 'Bebidas',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: '3',
    code: 'P003',
    barcode: '7501234567892',
    description: 'Agua San Luis 625ml',
    purchasePrice: 0.80,
    salePrice: 1.50,
    igv: 18,
    stock: 200,
    category: 'Bebidas',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  
  // Lácteos
  {
    id: '4',
    code: 'P004',
    barcode: '7501234567893',
    description: 'Leche Gloria Evaporada 400g',
    purchasePrice: 2.50,
    salePrice: 4.20,
    igv: 18,
    stock: 120,
    category: 'Lácteos',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: '5',
    code: 'P005',
    barcode: '7501234567894',
    description: 'Yogurt Gloria Fresa 1L',
    purchasePrice: 4.50,
    salePrice: 7.80,
    igv: 18,
    stock: 60,
    category: 'Lácteos',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  
  // Abarrotes
  {
    id: '6',
    code: 'P006',
    barcode: '7501234567895',
    description: 'Arroz Costeño Extra 5kg',
    purchasePrice: 8.50,
    salePrice: 14.90,
    igv: 18,
    stock: 50,
    category: 'Abarrotes',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: '7',
    code: 'P007',
    barcode: '7501234567896',
    description: 'Aceite Primor 1L',
    purchasePrice: 6.20,
    salePrice: 9.50,
    igv: 18,
    stock: 40,
    category: 'Abarrotes',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: '8',
    code: 'P008',
    barcode: '7501234567897',
    description: 'Azúcar Rubia Cartavio 1kg',
    purchasePrice: 2.80,
    salePrice: 4.50,
    igv: 18,
    stock: 80,
    category: 'Abarrotes',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  
  // Panadería
  {
    id: '9',
    code: 'P009',
    barcode: '7501234567898',
    description: 'Pan Francés Unidad',
    purchasePrice: 0.15,
    salePrice: 0.30,
    igv: 18,
    stock: 100,
    category: 'Panadería',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: '10',
    code: 'P010',
    barcode: '7501234567899',
    description: 'Pan Integral Bimbo',
    purchasePrice: 3.20,
    salePrice: 5.50,
    igv: 18,
    stock: 25,
    category: 'Panadería',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  
  // Snacks
  {
    id: '11',
    code: 'P011',
    barcode: '7501234567800',
    description: 'Papas Lay\'s Clásicas 45g',
    purchasePrice: 1.80,
    salePrice: 3.20,
    igv: 18,
    stock: 90,
    category: 'Snacks',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: '12',
    code: 'P012',
    barcode: '7501234567801',
    description: 'Chifles Inka Chips 100g',
    purchasePrice: 2.50,
    salePrice: 4.20,
    igv: 18,
    stock: 70,
    category: 'Snacks',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  
  // Limpieza
  {
    id: '13',
    code: 'P013',
    barcode: '7501234567802',
    description: 'Detergente Ariel 780g',
    purchasePrice: 8.50,
    salePrice: 13.90,
    igv: 18,
    stock: 30,
    category: 'Limpieza',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: '14',
    code: 'P014',
    barcode: '7501234567803',
    description: 'Papel Higiénico Suave 4 rollos',
    purchasePrice: 4.80,
    salePrice: 7.50,
    igv: 18,
    stock: 45,
    category: 'Limpieza',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  
  // Cuidado Personal
  {
    id: '15',
    code: 'P015',
    barcode: '7501234567804',
    description: 'Shampoo Head & Shoulders 400ml',
    purchasePrice: 12.50,
    salePrice: 18.90,
    igv: 18,
    stock: 20,
    category: 'Cuidado Personal',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: '16',
    code: 'P016',
    barcode: '7501234567805',
    description: 'Pasta Dental Colgate 75ml',
    purchasePrice: 3.80,
    salePrice: 6.50,
    igv: 18,
    stock: 35,
    category: 'Cuidado Personal',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  
  // Conservas
  {
    id: '17',
    code: 'P017',
    barcode: '7501234567806',
    description: 'Atún Florida en Aceite 170g',
    purchasePrice: 3.20,
    salePrice: 5.50,
    igv: 18,
    stock: 60,
    category: 'Conservas',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: '18',
    code: 'P018',
    barcode: '7501234567807',
    description: 'Leche Condensada Nestlé 393g',
    purchasePrice: 4.50,
    salePrice: 7.20,
    igv: 18,
    stock: 40,
    category: 'Conservas',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  
  // Dulces
  {
    id: '19',
    code: 'P019',
    barcode: '7501234567808',
    description: 'Chocolate Sublime 30g',
    purchasePrice: 1.20,
    salePrice: 2.50,
    igv: 18,
    stock: 80,
    category: 'Dulces',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: '20',
    code: 'P020',
    barcode: '7501234567809',
    description: 'Galletas Soda Field 6 pack',
    purchasePrice: 2.80,
    salePrice: 4.80,
    igv: 18,
    stock: 50,
    category: 'Dulces',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  }
];

export const useProductStore = create<ProductState>()(
  persist(
    (set, get) => ({
      products: mockProducts,
      categories: ['Bebidas', 'Lácteos', 'Abarrotes', 'Panadería', 'Snacks', 'Limpieza', 'Cuidado Personal', 'Conservas', 'Dulces'],

      addProduct: (productData) => {
        const newProduct: Product = {
          ...productData,
          id: Date.now().toString(),
          createdAt: new Date(),
          updatedAt: new Date()
        };

        set(state => ({
          products: [...state.products, newProduct],
          categories: productData.category && !state.categories.includes(productData.category)
            ? [...state.categories, productData.category]
            : state.categories
        }));
      },

      updateProduct: (id, updates) => {
        set(state => ({
          products: state.products.map(p => 
            p.id === id 
              ? { ...p, ...updates, updatedAt: new Date() }
              : p
          )
        }));
      },

      deleteProduct: (id) => {
        set(state => ({
          products: state.products.map(p => 
            p.id === id 
              ? { ...p, isActive: false, updatedAt: new Date() }
              : p
          )
        }));
      },

      updatePrice: (id, newPrice) => {
        get().updateProduct(id, { salePrice: newPrice });
      },

      updateStock: (id, quantity) => {
        set(state => ({
          products: state.products.map(p => 
            p.id === id 
              ? { ...p, stock: Math.max(0, p.stock - quantity), updatedAt: new Date() }
              : p
          )
        }));
      },

      restoreStock: (id, quantity) => {
        set(state => ({
          products: state.products.map(p => 
            p.id === id 
              ? { ...p, stock: p.stock + quantity, updatedAt: new Date() }
              : p
          )
        }));
      },

      getProductByCode: (code) => {
        return get().products.find(p => p.code === code && p.isActive);
      },

      getProductByBarcode: (barcode) => {
        return get().products.find(p => p.barcode === barcode && p.isActive);
      },

      searchProducts: (query) => {
        const products = get().products;
        const lowercaseQuery = query.toLowerCase();
        
        return products.filter(p => 
          p.isActive && (
            p.code.toLowerCase().includes(lowercaseQuery) ||
            p.description.toLowerCase().includes(lowercaseQuery) ||
            p.barcode.includes(query) ||
            p.category.toLowerCase().includes(lowercaseQuery)
          )
        );
      },

      getProductsByCategory: (category) => {
        return get().products.filter(p => p.category === category && p.isActive);
      },

      getLowStockProducts: (threshold = 10) => {
        return get().products.filter(p => p.isActive && p.stock <= threshold);
      }
    }),
    {
      name: 'product-storage'
    }
  )
);