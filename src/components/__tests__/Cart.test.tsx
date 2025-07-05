import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Cart } from '../Cart';
import { useCartStore } from '../../stores/cartStore';

jest.mock('../../stores/cartStore');
const mockUseCartStore = useCartStore as jest.MockedFunction<typeof useCartStore>;

describe('Cart Component', () => {
  const mockUpdateQuantity = jest.fn();
  const mockRemoveItem = jest.fn();

  const mockCartItem = {
    product: {
      id: '1',
      description: 'Inca Kola 500ml',
      code: 'P001',
      salePrice: 2.50,
      stock: 150,
    },
    quantity: 2,
    unitPrice: 2.50,
    discount: 0,
    total: 5.00
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('muestra carrito vacío', () => {
    mockUseCartStore.mockReturnValue({
      items: [],
      updateQuantity: mockUpdateQuantity,
      removeItem: mockRemoveItem,
      getSubtotal: () => 0,
      getDiscountAmount: () => 0,
      getIGVAmount: () => 0,
      getTotal: () => 0,
    } as any);

    render(<Cart />);
    
    expect(screen.getByText('El carrito está vacío')).toBeInTheDocument();
  });

  test('muestra items del carrito', () => {
    mockUseCartStore.mockReturnValue({
      items: [mockCartItem],
      updateQuantity: mockUpdateQuantity,
      removeItem: mockRemoveItem,
      getSubtotal: () => 5.00,
      getDiscountAmount: () => 0,
      getIGVAmount: () => 0.90,
      getTotal: () => 5.90,
    } as any);

    render(<Cart />);
    
    expect(screen.getByText('Carrito (1 producto)')).toBeInTheDocument();
    expect(screen.getByText('Inca Kola 500ml')).toBeInTheDocument();
    expect(screen.getByText('S/. 5.00')).toBeInTheDocument();
  });

  test('actualiza cantidad de producto', async () => {
    const user = userEvent.setup();
    
    mockUseCartStore.mockReturnValue({
      items: [mockCartItem],
      updateQuantity: mockUpdateQuantity,
      removeItem: mockRemoveItem,
      getSubtotal: () => 5.00,
      getDiscountAmount: () => 0,
      getIGVAmount: () => 0.90,
      getTotal: () => 5.90,
    } as any);

    render(<Cart />);
    
    const plusButton = screen.getAllByRole('button')[0]; // Botón +
    await user.click(plusButton);
    
    expect(mockUpdateQuantity).toHaveBeenCalledWith('1', 3);
  });
});
