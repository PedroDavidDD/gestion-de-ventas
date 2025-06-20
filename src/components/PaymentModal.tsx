import React, { useState } from 'react';
import { X, CreditCard, Banknote, Check } from 'lucide-react';
import { useCartStore } from '../stores/cartStore';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPayment: (method: 'cash' | 'card') => void;
  total: number;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ 
  isOpen, 
  onClose, 
  onPayment, 
  total 
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');
  const [cashReceived, setCashReceived] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const cashAmount = parseFloat(cashReceived) || 0;
  const change = cashAmount - total;

  const handlePayment = async () => {
    if (paymentMethod === 'cash' && cashAmount < total) {
      alert('El monto recibido es insuficiente');
      return;
    }

    setIsProcessing(true);
    
    // Simulate payment processing
    setTimeout(() => {
      onPayment(paymentMethod);
      setIsProcessing(false);
      setCashReceived('');
    }, paymentMethod === 'card' ? 2000 : 500);
  };

  const handleClose = () => {
    if (!isProcessing) {
      onClose();
      setCashReceived('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Procesar Pago
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
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">
              Total: S/. {total.toFixed(2)}
            </p>
          </div>

          <div className="space-y-4">
            <p className="text-sm font-medium text-gray-700">Método de Pago:</p>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setPaymentMethod('cash')}
                disabled={isProcessing}
                className={`p-4 border-2 rounded-lg flex flex-col items-center space-y-2 transition-all duration-200 ${
                  paymentMethod === 'cash'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <Banknote className="h-6 w-6" />
                <span className="text-sm font-medium">Efectivo</span>
              </button>
              
              <button
                onClick={() => setPaymentMethod('card')}
                disabled={isProcessing}
                className={`p-4 border-2 rounded-lg flex flex-col items-center space-y-2 transition-all duration-200 ${
                  paymentMethod === 'card'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <CreditCard className="h-6 w-6" />
                <span className="text-sm font-medium">Tarjeta</span>
              </button>
            </div>
          </div>

          {paymentMethod === 'cash' && (
            <div className="space-y-3">
              <label htmlFor="cash-received" className="block text-sm font-medium text-gray-700">
                Monto Recibido:
              </label>
              <input
                id="cash-received"
                type="number"
                value={cashReceived}
                onChange={(e) => setCashReceived(e.target.value)}
                disabled={isProcessing}
                step="0.01"
                min="0"
                className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
              />
              
              {cashAmount > 0 && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Recibido:</span>
                    <span className="font-medium">S/. {cashAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total:</span>
                    <span className="font-medium">S/. {total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t border-gray-300 pt-2 mt-2">
                    <span className={change >= 0 ? 'text-green-700' : 'text-red-700'}>
                      {change >= 0 ? 'Cambio:' : 'Faltante:'}
                    </span>
                    <span className={change >= 0 ? 'text-green-700' : 'text-red-700'}>
                      S/. {Math.abs(change).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {isProcessing && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">
                {paymentMethod === 'card' ? 'Procesando pago con tarjeta...' : 'Procesando pago...'}
              </p>
            </div>
          )}
        </div>

        <div className="flex space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={handleClose}
            disabled={isProcessing}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            Cancelar
          </button>
          <button
            onClick={handlePayment}
            disabled={isProcessing || (paymentMethod === 'cash' && cashAmount < total)}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
          >
            {isProcessing ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Confirmar Pago
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};