import React, { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "../stores/authStore";
import { useCartStore } from "../stores/cartStore";
import { useProductStore } from "../stores/productStore";
import { useSalesStore } from "../stores/salesStore";
import { ProductSearch } from "./ProductSearch";
import { Cart } from "./Cart";
import { PaymentModal } from "./PaymentModal";
import { ReceiptModal } from "./ReceiptModal";
import { RefundModal } from "./RefundModal";
import { AdminPanel } from "./AdminPanel";
import type { Product, Sale } from "../types";
import InactivityCounter from "./InactivityCounter";

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

  const { currentUser, logout, updateLastActivity, checkSessionTimeout } =
    useAuthStore();
  const {
    addItem,
    getTotal,
    getTotalRounded,
    clearCart,
    items,
    setCurrentUser,
  } = useCartStore();
  const { updateStock } = useProductStore();
  const { completeSale } = useSalesStore();

  // Set current user in cart store when user changes
  useEffect(() => {
    if (currentUser?.id) {
      setCurrentUser(currentUser.id);
    }
  }, [currentUser?.id, setCurrentUser]);

  // Update activity and check for session timeout
  useEffect(() => {
    const handleActivity = () => {
      updateLastActivity();
    };

    const handleSessionCheck = () => {
      checkSessionTimeout();
    };

    // Add event listeners for user activity
    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
    ];
    events.forEach((event) => {
      document.addEventListener(event, handleActivity, true);
    });

    // Check session timeout every minute
    const sessionInterval = setInterval(handleSessionCheck, 1000);

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity, true);
      });
      clearInterval(sessionInterval);
    };
  }, [updateLastActivity, checkSessionTimeout]);

  const handleProductSelect = useCallback(
    (product: Product, quantity: number = 1) => {
      if (product.stock <= 0) {
        alert("Producto sin stock disponible");
        return;
      }

      addItem(product, quantity);
      updateLastActivity();
    },
    [addItem, updateLastActivity]
  );

  const handleCheckout = useCallback(() => {
    if (items.length === 0) {
      alert("El carrito está vacío");
      return;
    }

    setIsPaymentModalOpen(true);
    updateLastActivity();
  }, [items.length, updateLastActivity]);

  const handlePayment = useCallback(
    (paymentMethod: "cash" | "card") => {
      if (!currentUser) return;

      try {
        // Update product stock
        items.forEach((item) => {
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

        // Clear cart and show receipt
        clearCart();

        // Use setTimeout to ensure state updates are processed
        setTimeout(() => {
          setIsReceiptModalOpen(true);
        }, 100);

        updateLastActivity();
      } catch (error) {
        console.error("Error processing payment:", error);
        alert("Error al procesar el pago");
      }
    },
    [
      currentUser,
      items,
      terminalId,
      sessionStartTime,
      updateStock,
      completeSale,
      clearCart,
      updateLastActivity,
    ]
  );

  const handleLogout = useCallback(() => {
    if (items.length > 0) {
      const confirmLogout = confirm(
        "Hay productos en el carrito. ¿Estás seguro de cerrar sesión?"
      );
      if (!confirmLogout) return;
    }

    logout();
  }, [items.length, logout]);

  const handleBackToMain = useCallback(() => {
    setShowAdminPanel(false);
  }, []);

  const handleClosePaymentModal = useCallback(() => {
    setIsPaymentModalOpen(false);
  }, []);

  const handleCloseReceiptModal = useCallback(() => {
    setIsReceiptModalOpen(false);
    setCurrentSale(null);
  }, []);

  const handleCloseRefundModal = useCallback(() => {
    setIsRefundModalOpen(false);
  }, []);

  const total = getTotal();
  const totalRounded = getTotalRounded();

  // Show admin panel if user is admin and admin panel is active
  if (showAdminPanel && currentUser?.role === "admin") {
    return <AdminPanel onBackToMain={handleBackToMain} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <InactivityCounter />
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <svg
                className="h-8 w-8 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Terminal {terminalId}
                </h1>
                <p className="text-sm text-gray-600">Sistema POS</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <span>{currentUser?.name}</span>
                <span className="text-gray-400">|</span>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    currentUser?.role === "admin"
                      ? "bg-purple-100 text-purple-800"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {currentUser?.role === "admin" ? "Administrador" : "Empleado"}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsRefundModalOpen(true)}
                  className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  <span>Devoluciones</span>
                </button>

                {currentUser?.role === "admin" && (
                  <button
                    onClick={() => setShowAdminPanel(true)}
                    className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <span>Administración</span>
                  </button>
                )}

                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
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
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                      />
                    </svg>
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
        onClose={handleClosePaymentModal}
        onPayment={handlePayment}
        total={total}
        totalRounded={totalRounded}
      />

      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={handleCloseReceiptModal}
        sale={currentSale}
      />

      <RefundModal
        isOpen={isRefundModalOpen}
        onClose={handleCloseRefundModal}
      />
    </div>
  );
};
