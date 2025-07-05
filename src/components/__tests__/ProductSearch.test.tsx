import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProductSearch } from '../ProductSearch';
import { useProductStore } from '../../stores/productStore';

jest.mock('../../stores/productStore');
const mockUseProductStore = useProductStore as jest.MockedFunction<typeof useProductStore>;

describe('ProductSearch Component', () => {
  const mockOnProductSelect = jest.fn();
  const mockSearchProducts = jest.fn();
  const mockGetProductByCode = jest.fn();

  const mockProduct = {
    id: '1',
    code: 'P001',
    description: 'Inca Kola 500ml',
    salePrice: 2.50,
    stock: 150,
    category: 'Bebidas',
  };

  beforeEach(() => {
    mockUseProductStore.mockReturnValue({
      searchProducts: mockSearchProducts,
      getProductByCode: mockGetProductByCode,
      getProductByBarcode: jest.fn(),
      getProductsByCategory: jest.fn(),
      categories: ['Bebidas', 'Lácteos'],
    } as any);
    
    jest.clearAllMocks();
  });

  test('renderiza campo de búsqueda', () => {
    render(<ProductSearch onProductSelect={mockOnProductSelect} />);
    
    expect(screen.getByPlaceholderText(/buscar por código/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '' })).toBeInTheDocument(); // Botón scan
  });

  test('busca productos al escribir', async () => {
    const user = userEvent.setup();
    mockSearchProducts.mockReturnValue([mockProduct]);
    
    render(<ProductSearch onProductSelect={mockOnProductSelect} />);
    
    const searchInput = screen.getByPlaceholderText(/buscar por código/i);
    await user.type(searchInput, 'Inca');
    
    expect(mockSearchProducts).toHaveBeenCalledWith('Inca');
  });

  test('muestra resultados de búsqueda', async () => {
    const user = userEvent.setup();
    mockSearchProducts.mockReturnValue([mockProduct]);
    
    render(<ProductSearch onProductSelect={mockOnProductSelect} />);
    
    const searchInput = screen.getByPlaceholderText(/buscar por código/i);
    await user.type(searchInput, 'Inc');
    
    expect(screen.getByText('Inca Kola 500ml')).toBeInTheDocument();
    expect(screen.getByText('S/. 2.50')).toBeInTheDocument();
  });

  test('selecciona producto al hacer clic', async () => {
    const user = userEvent.setup();
    mockSearchProducts.mockReturnValue([mockProduct]);
    
    render(<ProductSearch onProductSelect={mockOnProductSelect} />);
    
    const searchInput = screen.getByPlaceholderText(/buscar por código/i);
    await user.type(searchInput, 'Inc');
    
    const addButton = screen.getByRole('button', { name: /agregar/i });
    await user.click(addButton);
    
    expect(mockOnProductSelect).toHaveBeenCalledWith(mockProduct, 1);
  });
});
