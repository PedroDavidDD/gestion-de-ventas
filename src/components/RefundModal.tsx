import React, { useState } from 'react';
import { useSalesStore } from '../stores/salesStore';
import { useProductStore } from '../stores/productStore';
import { useAuthStore } from '../stores/authStore';
import type { Sale, CartItem } from '../types';

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

  const { getSaleByTicket, processRefund, getRefundsBySale } = useSalesStore();
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

    // Get existing refunds for this sale
    const existingRefunds = getRefundsBySale(sale.id);
    const refundedItems = new Map<string, number>();
    
    existingRefunds.forEach(refund => {
      refund.items.forEach(item => {
        const existing = refundedItems.get(item.product.id) || 0;
        refundedItems.set(item.product.id, existing + item.quantity);
      });
    });

    // Filter out already refunded items or reduce quantities
    const availableItems = sale.items.map(item => {
      const refundedQty = refundedItems.get(item.product.id) || 0;
      const availableQty = item.quantity - refundedQty;
      
      return availableQty > 0 ? {
        ...item,
        quantity: availableQty,
        total: (item.unitPrice * availableQty) - (item.discount * availableQty / item.quantity)
      } : null;
    }).filter(item => item !== null) as CartItem[];

    if (availableItems.length === 0) {
      alert('No hay productos disponibles para devolución en este ticket');
      return;
    }

    setSelectedSale({...sale, items: availableItems});
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

        alert(`Devolución procesada exitosamente. Monto devuelto: S/. ${refund.refundAmount.toFixed(2)}`);
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
            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Procesar Devolución
          </h3>
          <button
            onClick={handleClose}
            disabled={isProcessing}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-150"
          >
            <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
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
                placeholder="Ingresa el número de ticket (ej: T1234567890)"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isProcessing}
              />
              <button
                onClick={handleSearchTicket}
                disabled={isProcessing}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 flex items-center space-x-2"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
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
                <h5 className="font-medium text-gray-900">Productos Disponibles para Devolución:</h5>
                {selectedSale.items.map((item, index) => {
                  const refundItem = refundItems.find(ri => ri.product.id === item.product.id);
                  const refundQuantity = refundItem?.quantity || 0;

                  return (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.product.description}</p>
                        <p className="text-sm text-gray-600">
                          Precio: S/. {item.unitPrice.toFixed(2)} | Cantidad Disponible: {item.quantity}
                        </p>
                        {item.discount > 0 && (
                          <p className="text-sm text-green-600">
                            Descuento aplicado: S/. {(item.discount / item.quantity * (refundQuantity || item.quantity)).toFixed(2)}
                          </p>
                        )}
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
                  Motivo de la Devolución *
                </label>
                <textarea
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  rows={3}
                  placeholder="Describe el motivo de la devolución (producto defectuoso, cambio de opinión, etc.)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isProcessing}
                  required
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
                    <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
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
                  <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
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