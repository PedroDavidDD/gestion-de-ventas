import { useAuthStore } from '../../authStore';
import { act, renderHook } from '@testing-library/react';

// Mock para evitar persistencia
jest.mock('zustand/middleware', () => ({
  persist: (fn: any) => fn,
}));

describe('AuthStore - Unit Tests', () => {
  beforeEach(() => {
    // Reset store antes de cada test
    useAuthStore.setState({
      currentUser: null,
      sessions: [],
      isAuthenticated: false,
    });
  });

  describe('login', () => {
    test('debe autenticar usuario válido', async () => {
      const { result } = renderHook(() => useAuthStore());
      
      await act(async () => {
        const success = await result.current.login('1001', '1234', 'TERM-001');
        expect(success).toBe(true);
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.currentUser?.code).toBe('1001');
      expect(result.current.currentUser?.name).toBe('Juan Pérez');
    });

    test('debe rechazar usuario inválido', async () => {
      const { result } = renderHook(() => useAuthStore());
      
      await act(async () => {
        const success = await result.current.login('9999', 'wrong', 'TERM-001');
        expect(success).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.currentUser).toBe(null);
    });

    test('debe rechazar usuario inactivo', async () => {
      const { result } = renderHook(() => useAuthStore());
      
      // Simular usuario inactivo modificando el mock
      const originalFind = Array.prototype.find;
      Array.prototype.find = jest.fn().mockReturnValue({
        id: '1',
        code: '1001',
        isActive: false,
        password: '1234'
      });

      await act(async () => {
        const success = await result.current.login('1001', '1234', 'TERM-001');
        expect(success).toBe(false);
      });

      Array.prototype.find = originalFind;
    });

    test('debe prevenir sesiones concurrentes', async () => {
      const { result } = renderHook(() => useAuthStore());
      
      // Primera sesión
      await act(async () => {
        await result.current.login('1001', '1234', 'TERM-001');
      });

      // Intentar segunda sesión
      await act(async () => {
        const success = await result.current.login('1001', '1234', 'TERM-002');
        expect(success).toBe(false);
      });
    });

    test('debe crear sesión correctamente', async () => {
      const { result } = renderHook(() => useAuthStore());
      
      await act(async () => {
        await result.current.login('1001', '1234', 'TERM-001');
      });

      expect(result.current.sessions).toHaveLength(1);
      expect(result.current.sessions[0].terminalId).toBe('TERM-001');
      expect(result.current.sessions[0].employeeId).toBe('1');
      expect(result.current.sessions[0].isActive).toBe(true);
    });
  });

  describe('logout', () => {
    test('debe cerrar sesión correctamente', async () => {
      const { result } = renderHook(() => useAuthStore());
      
      // Login primero
      await act(async () => {
        await result.current.login('1001', '1234', 'TERM-001');
      });

      // Logout
      act(() => {
        result.current.logout();
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.currentUser).toBe(null);
      expect(result.current.sessions[0].isActive).toBe(false);
    });
  });

  describe('updateLastActivity', () => {
    test('debe actualizar última actividad', async () => {
      const { result } = renderHook(() => useAuthStore());
      
      await act(async () => {
        await result.current.login('1001', '1234', 'TERM-001');
      });

      const initialActivity = result.current.sessions[0].lastActivity;
      
      // Esperar un poco y actualizar
      await new Promise(resolve => setTimeout(resolve, 10));
      
      act(() => {
        result.current.updateLastActivity();
      });

      expect(result.current.sessions[0].lastActivity.getTime()).toBeGreaterThan(
        initialActivity.getTime()
      );
    });
  });

  describe('checkSessionTimeout', () => {
    test('debe cerrar sesión por timeout', async () => {
      const { result } = renderHook(() => useAuthStore());
      
      await act(async () => {
        await result.current.login('1001', '1234', 'TERM-001');
      });

      // Simular timeout modificando lastActivity
      act(() => {
        useAuthStore.setState({
          sessions: [{
            ...result.current.sessions[0],
            lastActivity: new Date(Date.now() - 21 * 60 * 1000) // 21 minutos atrás
          }]
        });
      });

      // Mock alert
      global.alert = jest.fn();

      act(() => {
        result.current.checkSessionTimeout();
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(global.alert).toHaveBeenCalledWith('Sesión cerrada por inactividad');
    });
  });
});
