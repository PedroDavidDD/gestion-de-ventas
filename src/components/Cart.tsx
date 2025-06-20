import React from 'react';
import { Trash2, Plus, Minus, ShoppingCart } from 'lucide-react';
import { useCartStore } from '../stores/cartStore';

export const Cart: React.FC = () => {
  const { 
    items, 
    updateQuantity, 
    removeItem, 
    getSubtotal, 
    getDiscountAmount, 
    getIGVAmount, 
    getTotal 
  } = useCartStore();

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center py-8">
          <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">El carrito está vacío</p>
          <p className="text-sm text-gray-400">Busca y agrega productos para comenzar</p>
        </div>
      </div>
    );
  }

  const subtotal = getSubtotal();
  const discount = getDiscountAmount();
  const igv = getIGVAmount();
  const total = getTotal();

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <ShoppingCart className="h-5 w-5 mr-2" />
          Carrito ({items.length} {items.length === 1 ? 'producto' : 'productos'})
        </h3>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {items.map((item) => (
          <div key={item.product.id} className="p-4 border-b border-gray-100">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900 truncate">
                  {item.product.description}
                </h4>
                <p className="text-xs text-gray-500">
                  Código: {item.product.code}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  S/. {item.unitPrice.toFixed(2)} c/u
                </p>
                {item.discount > 0 && (
                  <p className="text-xs text-green-600 font-medium">
                    Descuento: -S/. {item.discount.toFixed(2)}
                  </p>
                )}
              </div>
              
              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                  className="p-1 rounded-md hover:bg-gray-100 transition-colors duration-150"
                >
                  <Minus className="h-4 w-4 text-gray-600" />
                </button>
                
                <span className="w-8 text-center text-sm font-medium">
                  {item.quantity}
                </span>
                
                <button
                  onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                  className="p-1 rounded-md hover:bg-gray-100 transition-colors duration-150"
                  disabled={item.quantity >= item.product.stock}
                >
                  <Plus className="h-4 w-4 text-gray-600" />
                </button>
                
                <button
                  onClick={() => removeItem(item.product.id)}
                  className="p-1 rounded-md hover:bg-red-100 text-red-600 transition-colors duration-150"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <div className="mt-2 text-right">
              <span className="text-sm font-semibold text-gray-900">
                S/. {item.total.toFixed(2)}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 bg-gray-50 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Subtotal:</span>
          <span className="font better text-gray-900">S/. {subtotal.toFixed(2)}</span>
        </div>
        
        {discount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-green-600">Descuento:</span>
            <span className="font-medium text-green-600">-S/. {discount.toFixed(2)}</span>
          </div>
        )}
        
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">IGV (18%):</span>
          <span className="font-medium text-gray-900">S/. {igv.toFixed(2)}</span>
        </div>
        
        <div className="border-t border-gray-300 pt-2">
          <div className="flex justify-between text-lg font-bold">
            <span className="text-gray-900">Total:</span>
            <span className="text-blue-600">S/. {total.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};