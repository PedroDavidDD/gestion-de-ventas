import React, { useState } from 'react';
import { Plus, Edit, Trash2, Tag, Calendar, Package } from 'lucide-react';
import { useOfferStore } from '../stores/offerStore';
import { useProductStore } from '../stores/productStore';
import type { Offer } from '../types';

export const OfferManagement: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);

  const { offers, addOffer, updateOffer, deleteOffer, getActiveOffers } = useOfferStore();
  const { products } = useProductStore();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'nxm' as 'nxm' | 'n+m',
    productIds: [] as string[],
    buyQuantity: '',
    payQuantity: '',
    freeProductId: '',
    freeQuantity: '',
    startDate: '',
    endDate: '',
    isActive: true
  });

  const activeOffers = getActiveOffers();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const offerData = {
      name: formData.name,
      description: formData.description,
      type: formData.type,
      productIds: formData.productIds,
      buyQuantity: parseInt(formData.buyQuantity),
      payQuantity: formData.type === 'nxm' ? parseInt(formData.payQuantity) : undefined,
      freeProductId: formData.type === 'n+m' ? formData.freeProductId : undefined,
      freeQuantity: formData.type === 'n+m' ? parseInt(formData.freeQuantity) : undefined,
      startDate: new Date(formData.startDate),
      endDate: new Date(formData.endDate),
      isActive: formData.isActive,
      createdBy: '3' // Current admin user
    };

    if (editingOffer) {
      updateOffer(editingOffer.id, offerData);
    } else {
      addOffer(offerData);
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: 'nxm',
      productIds: [],
      buyQuantity: '',
      payQuantity: '',
      freeProductId: '',
      freeQuantity: '',
      startDate: '',
      endDate: '',
      isActive: true
    });
    setShowForm(false);
    setEditingOffer(null);
  };

  const handleEdit = (offer: Offer) => {
    setFormData({
      name: offer.name,
      description: offer.description || '',
      type: offer.type,
      productIds: offer.productIds,
      buyQuantity: offer.buyQuantity.toString(),
      payQuantity: offer.payQuantity?.toString() || '',
      freeProductId: offer.freeProductId || '',
      freeQuantity: offer.freeQuantity?.toString() || '',
      startDate: offer.startDate.toISOString().split('T')[0],
      endDate: offer.endDate.toISOString().split('T')[0],
      isActive: offer.isActive
    });
    setEditingOffer(offer);
    setShowForm(true);
  };

  const getProductName = (productId: string) => {
    const product = products.find(p => p.id === productId);
    return product ? product.description : 'Producto no encontrado';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Gestión de Ofertas</h2>
            <p className="text-gray-600">Administra las promociones y ofertas especiales</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            <Plus className="h-4 w-4" />
            <span>Nueva Oferta</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center">
              <Tag className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-blue-600">Ofertas Activas</p>
                <p className="text-2xl font-bold text-blue-900">{activeOffers.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-green-600">Total Ofertas</p>
                <p className="text-2xl font-bold text-green-900">{offers.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-purple-600">Próximas a Vencer</p>
                <p className="text-2xl font-bold text-purple-900">
                  {offers.filter(o => {
                    const daysUntilEnd = Math.ceil((o.endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                    return daysUntilEnd <= 7 && daysUntilEnd > 0;
                  }).length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Offer Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingOffer ? 'Editar Oferta' : 'Nueva Oferta'}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre de la Oferta
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Oferta
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value as 'nxm' | 'n+m'})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="nxm">NxM (ej: 3x2)</option>
                    <option value="n+m">N+M (ej: 2+1)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Productos Aplicables
                </label>
                <select
                  multiple
                  value={formData.productIds}
                  onChange={(e) => {
                    const values = Array.from(e.target.selectedOptions, option => option.value);
                    setFormData({...formData, productIds: values});
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-32"
                >
                  {products.filter(p => p.isActive).map(product => (
                    <option key={product.id} value={product.id}>
                      {product.description} - {product.code}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Mantén presionado Ctrl (Cmd en Mac) para seleccionar múltiples productos
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cantidad a Comprar
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.buyQuantity}
                    onChange={(e) => setFormData({...formData, buyQuantity: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {formData.type === 'nxm' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cantidad a Pagar
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.payQuantity}
                      onChange={(e) => setFormData({...formData, payQuantity: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Producto Gratis
                      </label>
                      <select
                        required
                        value={formData.freeProductId}
                        onChange={(e) => setFormData({...formData, freeProductId: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Seleccionar producto</option>
                        {products.filter(p => p.isActive).map(product => (
                          <option key={product.id} value={product.id}>
                            {product.description} - {product.code}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}
              </div>

              {formData.type === 'n+m' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cantidad Gratis
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.freeQuantity}
                    onChange={(e) => setFormData({...formData, freeQuantity: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de Inicio
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de Fin
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                  Oferta activa
                </label>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  {editingOffer ? 'Actualizar' : 'Crear'} Oferta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Offers List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Oferta
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Productos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vigencia
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {offers.map((offer) => (
                <tr key={offer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Tag className="h-8 w-8 text-blue-500 mr-3" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {offer.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {offer.description}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      offer.type === 'nxm' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {offer.type === 'nxm' 
                        ? `${offer.buyQuantity}x${offer.payQuantity}` 
                        : `${offer.buyQuantity}+${offer.freeQuantity}`
                      }
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {offer.productIds.map(id => getProductName(id)).join(', ')}
                    </div>
                    {offer.freeProductId && (
                      <div className="text-sm text-green-600">
                        Gratis: {getProductName(offer.freeProductId)}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>{offer.startDate.toLocaleDateString()}</div>
                    <div>{offer.endDate.toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      offer.isActive && offer.endDate >= new Date()
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {offer.isActive && offer.endDate >= new Date() ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleEdit(offer)}
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors duration-200"
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('¿Estás seguro de eliminar esta oferta?')) {
                            deleteOffer(offer.id);
                          }
                        }}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors duration-200"
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};