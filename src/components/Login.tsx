import React, { useState, useEffect } from 'react';
import { LogIn, Monitor, User, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

interface LoginProps {
  terminalId: string;
}

export const Login: React.FC<LoginProps> = ({ terminalId }) => {
  const [employeeCode, setEmployeeCode] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // ✅ Validaciones mejoradas
    if (!employeeCode.trim()) {
      setError('Por favor ingrese su código');
      return;
    }

    if (!password.trim()) {
      setError('Por favor ingrese su contraseña');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const success = await login(employeeCode, password, terminalId);
      
      if (!success) {
        setError('Código o contraseña inválido');
      }
    } catch (err: any) {
      // Manejo específico de errores
      if (err.message.includes('inactivo')) {
        setError('Usuario inactivo. Contacte con administración');
      } else if (err.message.includes('activo en otro terminal')) {
        setError('El empleado ya está activo en otro terminal');
      } else {
        setError('Error al iniciar sesión');
      }
    } finally {
      setIsLoading(false);
      setEmployeeCode('');
      setPassword('');
    }
  };

  useEffect(() => {
    const input = document.getElementById('employee-code');
    if (input) {
      input.focus();
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <Monitor className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Sistema POS</h1>
          <p className="text-gray-600">Terminal {terminalId}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="employee-code" className="block text-sm font-medium text-gray-700 mb-2">
              Código de Empleado
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="employee-code"
                type="text"
                value={employeeCode}
                onChange={(e) => setEmployeeCode(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="Ingresa tu código"
                disabled={isLoading}
                autoComplete="username"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Contraseña
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="Ingresa tu contraseña"
                disabled={isLoading}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start space-x-2">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                <LogIn className="w-5 h-5 mr-2" />
                Iniciar Sesión
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="text-xs text-gray-500 space-y-1">
            <p><strong>Empleados:</strong></p>
            <p>• Código: 1001, Contraseña: 1234</p>
            <p>• Código: 2001, Contraseña: 1234</p>
            <p><strong>Admin:</strong></p>
            <p>• Código: 9999, Contraseña: admin123</p>
          </div>
        </div>
      </div>
    </div>
  );
};
