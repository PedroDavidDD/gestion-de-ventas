import React, { useState, useEffect, useRef } from 'react';
import { Search, Scan, Package, Plus, Minus } from 'lucide-react';
import { useProductStore } from '../stores/productStore';
import { Product } from '../types';

interface ProductSearchProps {
  onProductSelect: (product: Product, quantity?: number) => void;
}

export const ProductSearch: React.FC<ProductSearchProps> = ({ onProductSelect }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [quantities, setQuantities] = useState<{[key: string]: number}>({});
  
  const inputRef = useRef<HTMLInputElement>(null);
  const { searchProducts, getProductByCode, getProductByBarcode, getProductsByCategory, categories, products } = useProductStore();

  useEffect(() => {
    if (query.length >= 2) {
      const searchResults = searchProducts(query);
      setResults(searchResults);
      setIsOpen(true);
      setSelectedIndex(-1);
    } else if (selectedCategory) {
      const categoryResults = getProductsByCategory(selectedCategory);
      setResults(categoryResults);
      setIsOpen(true);
      setSelectedIndex(-1);
    } else {
      setResults([]);
      setIsOpen(false);
    }
  }, [query, selectedCategory, searchProducts, getProductsByCategory]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setSelectedCategory('');
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setQuery('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < results.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : results.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          selectProduct(results[selectedIndex]);
        } else if (results.length === 1) {
          selectProduct(results[0]);
        } else {
          // Try to find product by exact code or barcode
          const product = getProductByCode(query) || getProductByBarcode(query);
          if (product) {
            selectProduct(product);
          }
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const selectProduct = (product: Product, quantity: number = 1) => {
    onProductSelect(product, quantity);
    setQuery('');
    setResults([]);
    setIsOpen(false);
    setSelectedIndex(-1);
    setSelectedCategory('');
    inputRef.current?.focus();
  };

  const updateQuantity = (productId: string, quantity: number) => {
    setQuantities(prev => ({
      ...prev,
      [productId]: Math.max(1, quantity)
    }));
  };

  const getQuantity = (productId: string) => {
    return quantities[productId] || 1;
  };

  const simulateBarcodeScan = () => {
    // Simulate barcode scan with demo barcode
    const demoBarcodes = ['7501234567890', '7501234567891', '7501234567892'];
    const randomBarcode = demoBarcodes[Math.floor(Math.random() * demoBarcodes.length)];
    const product = getProductByBarcode(randomBarcode);
    if (product) {
      selectProduct(product);
    } else {
      alert('Producto no encontrado');
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative flex">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            placeholder="Buscar por código, nombre o código de barras..."
          />
        </div>
        <button
          onClick={simulateBarcodeScan}
          className="px-4 py-3 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
          title="Simular escaneo de código de barras"
        >
          <Scan className="h-5 w-5" />
        </button>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => handleCategoryChange('')}
          className={`px-3 py-1 text-sm rounded-full transition-colors duration-200 ${
            selectedCategory === ''
              ? 'bg-blue-100 text-blue-700 border border-blue-200'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Todas
        </button>
        {categories.map(category => (
          <button
            key={category}
            onClick={() => handleCategoryChange(category)}
            className={`px-3 py-1 text-sm rounded-full transition-colors duration-200 ${
              selectedCategory === category
                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Search Results */}
      {isOpen && results.length > 0 && (
        <div className="bg-white border border-gray-300 rounded-lg shadow-lg max-h-96 overflow-y-auto">
          {results.map((product, index) => (
            <div
              key={product.id}
              className={`p-4 border-b border-gray-100 last:border-b-0 hover:bg-blue-50 transition-colors duration-150 ${
                index === selectedIndex ? 'bg-blue-50' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center flex-1">
                  <Package className="h-5 w-5 text-gray-400 mr-3" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {product.description}
                    </p>
                    <p className="text-xs text-gray-500">
                      Código: {product.code} | Stock: {product.stock} | S/. {product.salePrice.toFixed(2)}
                    </p>
                    <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full mt-1">
                      {product.category}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 ml-4">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateQuantity(product.id, getQuantity(product.id) - 1);
                      }}
                      className="p-1 rounded-md hover:bg-gray-200 transition-colors duration-150"
                    >
                      <Minus className="h-4 w-4 text-gray-600" />
                    </button>
                    
                    <span className="w-8 text-center text-sm font-medium">
                      {getQuantity(product.id)}
                    </span>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateQuantity(product.id, getQuantity(product.id) + 1);
                      }}
                      className="p-1 rounded-md hover:bg-gray-200 transition-colors duration-150"
                      disabled={getQuantity(product.id) >= product.stock}
                    >
                      <Plus className="h-4 w-4 text-gray-600" />
                    </button>
                  </div>
                  
                  <button
                    onClick={() => selectProduct(product, getQuantity(product.id))}
                    disabled={product.stock <= 0}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    Agregar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No results */}
      {isOpen && results.length === 0 && (query.length >= 2 || selectedCategory) && (
        <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-4 text-center text-gray-500">
          No se encontraron productos
        </div>
      )}
    </div>
  );
};