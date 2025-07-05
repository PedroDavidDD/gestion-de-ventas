import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Login } from '../../components/Login';

// Mock simple del store
const mockAuthStore = {
  login: jest.fn(),
  currentUser: null,
  isAuthenticated: false,
};

jest.mock('../../stores/authStore', () => ({
  useAuthStore: () => mockAuthStore,
}));

describe('Login Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('flujo completo de login exitoso', async () => {
    const user = userEvent.setup();
    mockAuthStore.login.mockResolvedValue(true);
    
    render(<Login terminalId="TERM-123" />);
    
    await user.type(screen.getByLabelText(/código/i), '1001');
    await user.type(screen.getByLabelText(/contraseña/i), '1234');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));
    
    await waitFor(() => {
      expect(mockAuthStore.login).toHaveBeenCalledWith('1001', '1234', 'TERM-123');
    });
  });

  test('maneja errores de login', async () => {
    const user = userEvent.setup();
    mockAuthStore.login.mockResolvedValue(false);
    
    render(<Login terminalId="TERM-123" />);
    
    await user.type(screen.getByLabelText(/código/i), 'wrong');
    await user.type(screen.getByLabelText(/contraseña/i), 'wrong');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Código o contraseña inválido')).toBeInTheDocument();
    });
  });
});
