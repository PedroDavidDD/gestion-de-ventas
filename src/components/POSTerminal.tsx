import React, { useState, useEffect } from 'react';
import { LogOut, User, Monitor, CreditCard, Banknote, Settings, RotateCcw } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useCartStore } from '../stores/cartStore';
import { useProductStore } from '../stores/productStore';
import { useSalesStore } from '../stores/salesStore';
import { ProductSearch } from './ProductSearch';
import { Cart } from './Cart';
import { PaymentModal } from './PaymentModal';
import { ReceiptModal } from './ReceiptModal';
import { RefundModal } from './RefundModal';
import { AdminPanel } from './AdminPanel';
import { Product, Sale } from '../types';

interface POSTerminalProps {
  terminalId: string;
}

export const POSTerminal: React.FC<POSTerminalProps> = ({ terminalId }) => {
  const [sessionStartTime] = useState(new Date());
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [currentSale, setCurrentSale] = useState<Sale | null>(null);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  const { currentUser, logout, updateLastActivity, checkSessionTimeout } = useAuthStore();
  const { addItem, getTotal, clearCart, items } = useCartStore();
  const { updateStock } = useProductStore();
  const { completeSale } = useSalesStore();

  // Update activity and check for session timeout
  useEffect(() => {
    const handleActivity = () => {
      updateLastActivity();
    };

    const handleSessionCheck = () => {
      checkSessionTimeout();
    };

    // Add event listeners for user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Check session timeout every minute
    const sessionInterval = setInterval(handleSessionCheck, 60000);

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      clearInterval(sessionInterval);
    };
  }, [updateLastActivity, checkSessionTimeout]);

  const handleProductSelect = (product: Product, quantity: number = 1) => {
    if (product.stock <= 0) {
      alert('Producto sin stock disponible');
      return;
    }
    
    addItem(product, quantity);
    updateLastActivity();
  };

  const handleCheckout = () => {
    if (items.length === 0) {
      alert('El carrito está vacío');
      return;
    }

    setIsPaymentModalOpen(true);
    updateLastActivity();
  };

  const handlePayment = (paymentMethod: 'cash' | 'card') => {
    if (!currentUser) return;

    // Update product stock
    items.forEach(item => {
      updateStock(item.product.id, item.quantity);
    });

    // Complete sale
    const sale = completeSale(
      currentUser.id,
      currentUser.name,
      terminalId,
      items,
      paymentMethod,
      sessionStartTime
    );

    setCurrentSale(sale);
    setIsPaymentModalOpen(false);
    setIsReceiptModalOpen(true);
    clearCart();
    updateLastActivity();
  };

  const handleLogout = () => {
    if (items.length > 0) {
      const confirmLogout = confirm('Hay productos en el carrito. ¿Estás seguro de cerrar sesión?');
      if (!confirmLogout) return;
    }
    
    logout();
  };

  const total = getTotal();

  // Show admin panel if user is admin and admin panel is active
  if (showAdminPanel && currentUser?.role === 'admin') {
    return <AdminPanel />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Monitor className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Terminal {terminalId}</h1>
                <p className="text-sm text-gray-600">Sistema POS</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <User className="h-4 w-4" />
                <span>{currentUser?.name}</span>
                <span className="text-gray-400">|</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  currentUser?.role === 'admin' 
                    ? 'bg-purple-100 text-purple-800' 
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {currentUser?.role === 'admin' ? 'Administrador' : 'Empleado'}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsRefundModalOpen(true)}
                  className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>Devoluciones</span>
                </button>

                {currentUser?.role === 'admin' && (
                  <button
                    onClick={() => setShowAdminPanel(true)}
                    className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200"
                  >
                    <Settings className="h-4 w-4" />
                    <span>Administración</span>
                  </button>
                )}
                
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Product Search */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Buscar Productos
              </h2>
              <ProductSearch onProductSelect={handleProductSelect} />
            </div>
          </div>

          {/* Right Column - Cart and Checkout */}
          <div className="space-y-6">
            <Cart />
            
            {/* Checkout Section */}
            {items.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">
                      Total: S/. {total.toFixed(2)}
                    </p>
                  </div>
                  
                  <button
                    onClick={handleCheckout}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200"
                  >
                    <CreditCard className="h-5 w-5" />
                    <span>Procesar Pago</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modals */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onPayment={handlePayment}
        total={total}
      />
      
      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        sale={currentSale}
      />

      <RefundModal
        isOpen={isRefundModalOpen}
        onClose={() => setIsRefundModalOpen(false)}
      />
    </div>
  );
};