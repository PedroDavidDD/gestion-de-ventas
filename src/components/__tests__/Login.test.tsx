import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Login } from '../Login';
import { useAuthStore } from '../../stores/authStore';

// Mock del store
jest.mock('../../stores/authStore');
const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;

describe('Login Component', () => {
  const mockLogin = jest.fn();
  const defaultTerminalId = 'TERM-123456';

  beforeEach(() => {
    mockUseAuthStore.mockReturnValue({
      login: mockLogin,
      currentUser: null,
      sessions: [],
      isAuthenticated: false,
      users: [],
      logout: jest.fn(),
      updateLastActivity: jest.fn(),
      checkSessionTimeout: jest.fn(),
      isUserActiveInOtherTerminal: jest.fn(),
      updateUsers: jest.fn(),
      addUser: jest.fn(),
      updateUser: jest.fn(),
      deleteUser: jest.fn(),
    });
    mockLogin.mockClear();
    jest.clearAllMocks();
  });

  test('renderiza correctamente el formulario de login', () => {
    render(<Login terminalId={defaultTerminalId} />);
    
    expect(screen.getByText('Sistema POS')).toBeInTheDocument();
    expect(screen.getByText(`Terminal ${defaultTerminalId}`)).toBeInTheDocument();
    expect(screen.getByLabelText(/código de empleado/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument();
  });

  test('muestra error cuando los campos están vacíos', async () => {
    const user = userEvent.setup();
    render(<Login terminalId={defaultTerminalId} />);
    
    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });
    await user.click(submitButton);
    
    expect(screen.getByText('Por favor ingrese su código')).toBeInTheDocument();
  });

  test('muestra error cuando falta la contraseña', async () => {
    const user = userEvent.setup();
    render(<Login terminalId={defaultTerminalId} />);
    
    const codeInput = screen.getByLabelText(/código de empleado/i);
    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });
    
    await user.type(codeInput, '1001');
    await user.click(submitButton);
    
    expect(screen.getByText('Por favor ingrese su contraseña')).toBeInTheDocument();
  });

  test('llama a login con credenciales correctas', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValue(true);
    
    render(<Login terminalId={defaultTerminalId} />);
    
    const codeInput = screen.getByLabelText(/código de empleado/i);
    const passwordInput = screen.getByLabelText(/contraseña/i);
    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });
    
    await user.type(codeInput, '1001');
    await user.type(passwordInput, '1234');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('1001', '1234', defaultTerminalId);
    });
  });

  test('muestra error para credenciales inválidas', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValue(false);
    
    render(<Login terminalId={defaultTerminalId} />);
    
    const codeInput = screen.getByLabelText(/código de empleado/i);
    const passwordInput = screen.getByLabelText(/contraseña/i);
    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });
    
    await user.type(codeInput, '9999');
    await user.type(passwordInput, 'wrong');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Código o contraseña inválido')).toBeInTheDocument();
    });
  });

  test('muestra error para usuario inactivo', async () => {
    const user = userEvent.setup();
    mockLogin.mockRejectedValue(new Error('Usuario inactivo. Contacte con administración'));
    
    render(<Login terminalId={defaultTerminalId} />);
    
    const codeInput = screen.getByLabelText(/código de empleado/i);
    const passwordInput = screen.getByLabelText(/contraseña/i);
    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });
    
    await user.type(codeInput, '1001');
    await user.type(passwordInput, '1234');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Usuario inactivo. Contacte con administración')).toBeInTheDocument();
    });
  });

  test('toggle de mostrar/ocultar contraseña funciona', async () => {
    const user = userEvent.setup();
    render(<Login terminalId={defaultTerminalId} />);
    
    const passwordInput = screen.getByLabelText(/contraseña/i) as HTMLInputElement;
    const toggleButton = screen.getByRole('button', { name: '' }); // El botón del ojo
    
    expect(passwordInput.type).toBe('password');
    
    await user.click(toggleButton);
    expect(passwordInput.type).toBe('text');
    
    await user.click(toggleButton);
    expect(passwordInput.type).toBe('password');
  });
});
