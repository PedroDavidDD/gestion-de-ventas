export interface User {
  id: string;
  code: string;
  name: string;
  role: 'employee' | 'admin';
  isActive: boolean;
  password: string;
  lastLogin?: Date;
  terminalId?: string;
}

export interface Product {
  id: string;
  code: string;
  barcode: string;
  description: string;
  purchasePrice: number;
  salePrice: number;
  igv: number;
  stock: number;
  category: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}

export interface Sale {
  id: string;
  ticketNumber: string;
  employeeId: string;
  employeeName: string;
  terminalId: string;
  items: CartItem[];
  subtotal: number;
  igvAmount: number;
  discountAmount: number;
  total: number;
  paymentMethod: 'cash' | 'card';
  status: 'completed' | 'refunded' | 'partial_refund';
  createdAt: Date;
  sessionStart: Date;
  sessionEnd: Date;
}

export interface Refund {
  id: string;
  originalSaleId: string;
  ticketNumber: string;
  employeeId: string;
  employeeName: string;
  items: CartItem[];
  refundAmount: number;
  reason: string;
  createdAt: Date;
}

export interface Offer {
  id: string;
  name: string;
  description?: string;
  type: 'nxm' | 'n+m';
  productIds: string[];
  buyQuantity: number;
  payQuantity?: number; // para nxm
  freeProductId?: string; // para n+m
  freeQuantity?: number; // para n+m
  isActive: boolean;
  startDate: Date;
  endDate: Date;
  createdBy: string;
  createdAt: Date;
}

export interface Session {
  terminalId: string;
  employeeId: string;
  startTime: Date;
  lastActivity: Date;
  isActive: boolean;
}