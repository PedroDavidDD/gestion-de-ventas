import React from 'react';
import { X, Printer, Download } from 'lucide-react';
import { Sale } from '../types';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale | null;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ 
  isOpen, 
  onClose, 
  sale 
}) => {
  if (!isOpen || !sale) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Simulate receipt download
    alert('Descarga de recibo simulada');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Ticket de Venta
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-150"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-4 font-mono text-sm">
          <div className="text-center border-b border-gray-200 pb-4">
            <h2 className="text-lg font-bold">SISTEMA POS</h2>
            <p className="text-gray-600">Terminal {sale.terminalId}</p>
            <p className="text-gray-600">RUC: 20123456789</p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Ticket:</span>
              <span className="font-bold">{sale.ticketNumber}</span>
            </div>
            <div className="flex justify-between">
              <span>Fecha:</span>
              <span>{sale.createdAt.toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Hora:</span>
              <span>{sale.createdAt.toLocaleTimeString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Cajero:</span>
              <span>{sale.employeeName}</span>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <div className="space-y-2">
              {sale.items.map((item, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between">
                    <span className="truncate">{item.product.description}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>{item.quantity} x S/. {item.unitPrice.toFixed(2)}</span>
                    <span>S/. {(item.quantity * item.unitPrice).toFixed(2)}</span>
                  </div>
                  {item.discount > 0 && (
                    <div className="flex justify-between text-xs text-green-600">
                      <span>Descuento</span>
                      <span>-S/. {item.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-medium">
                    <span>Subtotal</span>
                    <span>S/. {item.total.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4 space-y-2">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>S/. {sale.subtotal.toFixed(2)}</span>
            </div>
            
            {sale.discountAmount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Descuento:</span>
                <span>-S/. {sale.discountAmount.toFixed(2)}</span>
              </div>
            )}
            
            <div className="flex justify-between">
              <span>IGV (18%):</span>
              <span>S/. {sale.igvAmount.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between font-bold text-lg border-t border-gray-200 pt-2">
              <span>TOTAL:</span>
              <span>S/. {sale.total.toFixed(2)}</span>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <div className="flex justify-between">
              <span>Método de Pago:</span>
              <span className="uppercase">
                {sale.paymentMethod === 'cash' ? 'EFECTIVO' : 'TARJETA'}
              </span>
            </div>
          </div>

          <div className="text-center text-xs text-gray-500 border-t border-gray-200 pt-4">
            <p>¡Gracias por su compra!</p>
            <p>Conserve su ticket</p>
          </div>
        </div>

        <div className="flex space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={handlePrint}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 flex items-center justify-center"
          >
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </button>
          <button
            onClick={handleDownload}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 flex items-center justify-center"
          >
            <Download className="h-4 w-4 mr-2" />
            Descargar
          </button>
        </div>
      </div>
    </div>
  );
};