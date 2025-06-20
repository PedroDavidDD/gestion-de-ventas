import React, { useState } from 'react';
import { X, Search, RotateCcw, AlertTriangle } from 'lucide-react';
import { useSalesStore } from '../stores/salesStore';
import { useProductStore } from '../stores/productStore';
import { useAuthStore } from '../stores/authStore';
import { Sale, CartItem } from '../types';

interface RefundModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RefundModal: React.FC<RefundModalProps> = ({ isOpen, onClose }) => {
  const [ticketNumber, setTicketNumber] = useState('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [refundItems, setRefundItems] = useState<CartItem[]>([]);
  const [refundReason, setRefundReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const { getSaleByTicket, processRefund } = useSalesStore();
  const { restoreStock } = useProductStore();
  const { currentUser } = useAuthStore();

  if (!isOpen) return null;

  const handleSearchTicket = () => {
    if (!ticketNumber.trim()) {
      alert('Por favor ingresa un número de ticket');
      return;
    }

    const sale = getSaleByTicket(ticketNumber);
    if (!sale) {
      alert('Ticket no encontrado');
      return;
    }

    if (sale.status === 'refunded') {
      alert('Este ticket ya fue devuelto completamente');
      return;
    }

    setSelectedSale(sale);
    setRefundItems([]);
  };

  const handleItemToggle = (item: CartItem, quantity: number) => {
    const existingIndex = refundItems.findIndex(ri => ri.product.id === item.product.id);
    
    if (quantity <= 0) {
      if (existingIndex >= 0) {
        setRefundItems(refundItems.filter((_, index) => index !== existingIndex));
      }
    } else {
      const refundItem: CartItem = {
        ...item,
        quantity: Math.min(quantity, item.quantity),
        total: (item.unitPrice * Math.min(quantity, item.quantity)) - (item.discount * Math.min(quantity, item.quantity) / item.quantity)
      };

      if (existingIndex >= 0) {
        setRefundItems(refundItems.map((ri, index) => 
          index === existingIndex ? refundItem : ri
        ));
      } else {
        setRefundItems([...refundItems, refundItem]);
      }
    }
  };

  const handleProcessRefund = async () => {
    if (!selectedSale || !currentUser) return;

    if (refundItems.length === 0) {
      alert('Selecciona al menos un producto para devolver');
      return;
    }

    if (!refundReason.trim()) {
      alert('Por favor ingresa el motivo de la devolución');
      return;
    }

    setIsProcessing(true);

    try {
      // Process refund
      const refund = processRefund(
        selectedSale.id,
        currentUser.id,
        currentUser.name,
        refundItems,
        refundReason
      );

      if (refund) {
        // Restore stock
        refundItems.forEach(item => {
          restoreStock(item.product.id, item.quantity);
        });

        alert('Devolución procesada exitosamente');
        handleClose();
      } else {
        alert('Error al procesar la devolución');
      }
    } catch (error) {
      alert('Error al procesar la devolución');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setTicketNumber('');
    setSelectedSale(null);
    setRefundItems([]);
    setRefundReason('');
    setIsProcessing(false);
    onClose();
  };

  const refundTotal = refundItems.reduce((sum, item) => sum + item.total, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <RotateCcw className="h-5 w-5 mr-2" />
            Procesar Devolución
          </h3>
          <button
            onClick={handleClose}
            disabled={isProcessing}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-150"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Search Ticket */}
          <div className="bg-gray-50 rounded-lg p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Número de Ticket
            </label>
            <div className="flex space-x-3">
              <input
                type="text"
                value={ticketNumber}
                onChange={(e) => setTicketNumber(e.target.value)}
                placeholder="Ingresa el número de ticket"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isProcessing}
              />
              <button
                onClick={handleSearchTicket}
                disabled={isProcessing}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 flex items-center space-x-2"
              >
                <Search className="h-4 w-4" />
                <span>Buscar</span>
              </button>
            </div>
          </div>

          {/* Sale Details */}
          {selectedSale && (
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-lg font-medium text-gray-900">
                    Ticket: {selectedSale.ticketNumber}
                  </h4>
                  <p className="text-sm text-gray-600">
                    Fecha: {selectedSale.createdAt.toLocaleDateString()} {selectedSale.createdAt.toLocaleTimeString()}
                  </p>
                  <p className="text-sm text-gray-600">
                    Empleado: {selectedSale.employeeName}
                  </p>
                  <p className="text-sm text-gray-600">
                    Total Original: S/. {selectedSale.total.toFixed(2)}
                  </p>
                </div>
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                  selectedSale.status === 'completed' ? 'bg-green-100 text-green-800' :
                  selectedSale.status === 'partial_refund' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {selectedSale.status === 'completed' ? 'Completado' :
                   selectedSale.status === 'partial_refund' ? 'Devolución Parcial' :
                   'Devuelto'}
                </span>
              </div>

              {/* Items to Refund */}
              <div className="space-y-3">
                <h5 className="font-medium text-gray-900">Productos a Devolver:</h5>
                {selectedSale.items.map((item, index) => {
                  const refundItem = refundItems.find(ri => ri.product.id === item.product.id);
                  const refundQuantity = refundItem?.quantity || 0;

                  return (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.product.description}</p>
                        <p className="text-sm text-gray-600">
                          Precio: S/. {item.unitPrice.toFixed(2)} | Cantidad Original: {item.quantity}
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          <label className="text-sm text-gray-600">Devolver:</label>
                          <input
                            type="number"
                            min="0"
                            max={item.quantity}
                            value={refundQuantity}
                            onChange={(e) => handleItemToggle(item, parseInt(e.target.value) || 0)}
                            className="w-16 px-2 py-1 border border-gray-300 rounded text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={isProcessing}
                          />
                        </div>
                        
                        {refundQuantity > 0 && (
                          <div className="text-sm font-medium text-green-600">
                            S/. {((item.unitPrice * refundQuantity) - (item.discount * refundQuantity / item.quantity)).toFixed(2)}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Refund Reason */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Motivo de la Devolución
                </label>
                <textarea
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  rows={3}
                  placeholder="Describe el motivo de la devolución..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isProcessing}
                />
              </div>

              {/* Refund Summary */}
              {refundItems.length > 0 && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-900">Total a Devolver:</span>
                    <span className="text-xl font-bold text-blue-600">
                      S/. {refundTotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center mt-2 text-sm text-gray-600">
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    <span>El stock será restaurado automáticamente</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {isProcessing && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Procesando devolución...</p>
            </div>
          )}
        </div>

        <div className="flex space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={handleClose}
            disabled={isProcessing}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 transition-colors duration-200"
          >
            Cancelar
          </button>
          
          {selectedSale && refundItems.length > 0 && (
            <button
              onClick={handleProcessRefund}
              disabled={isProcessing || !refundReason.trim()}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 transition-colors duration-200 flex items-center justify-center"
            >
              {isProcessing ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Procesar Devolución
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};