import React, { useState } from 'react';
import { 
  Users, 
  Package, 
  Tag, 
  BarChart3, 
  Settings,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useProductStore } from '../stores/productStore';
import { useOfferStore } from '../stores/offerStore';
import { useSalesStore } from '../stores/salesStore';
import { ProductManagement } from './ProductManagement';
import { OfferManagement } from './OfferManagement';
import { UserManagement } from './UserManagement';
import { SalesReports } from './SalesReports';

type AdminTab = 'products' | 'offers' | 'users' | 'reports' | 'settings';

export const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('products');
  const { currentUser } = useAuthStore();
  const { products, getLowStockProducts } = useProductStore();
  const { offers, getActiveOffers } = useOfferStore();
  const { sales, getTodaySales } = useSalesStore();

  if (currentUser?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <div className="text-red-500 mb-4">
            <Settings className="h-12 w-12 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Acceso Denegado
          </h2>
          <p className="text-gray-600">
            Solo los administradores pueden acceder a este panel.
          </p>
        </div>
      </div>
    );
  }

  const lowStockProducts = getLowStockProducts();
  const activeOffers = getActiveOffers();
  const todaySales = getTodaySales();

  const tabs = [
    {
      id: 'products' as AdminTab,
      name: 'Productos',
      icon: Package,
      count: products.filter(p => p.isActive).length,
      alert: lowStockProducts.length > 0 ? lowStockProducts.length : undefined
    },
    {
      id: 'offers' as AdminTab,
      name: 'Ofertas',
      icon: Tag,
      count: activeOffers.length
    },
    {
      id: 'users' as AdminTab,
      name: 'Usuarios',
      icon: Users,
      count: 3 // Mock count
    },
    {
      id: 'reports' as AdminTab,
      name: 'Reportes',
      icon: BarChart3,
      count: todaySales.length
    },
    {
      id: 'settings' as AdminTab,
      name: 'Configuración',
      icon: Settings
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'products':
        return <ProductManagement />;
      case 'offers':
        return <OfferManagement />;
      case 'users':
        return <UserManagement />;
      case 'reports':
        return <SalesReports />;
      case 'settings':
        return (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Configuración del Sistema
            </h3>
            <p className="text-gray-600">
              Panel de configuración en desarrollo...
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Settings className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Panel de Administración</h1>
                <p className="text-sm text-gray-600">Gestión del Sistema POS</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex space-x-8">
          {/* Sidebar */}
          <div className="w-64 flex-shrink-0">
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 text-left rounded-lg transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{tab.name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {tab.count !== undefined && (
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          activeTab === tab.id
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {tab.count}
                        </span>
                      )}
                      {tab.alert && (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">
                          {tab.alert}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
};