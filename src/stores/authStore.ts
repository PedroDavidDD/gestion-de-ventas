import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Session } from '../types';

interface AuthState {
  currentUser: User | null;
  sessions: Session[];
  isAuthenticated: boolean;
  users: User[]; // ✅ NUEVO: Usuarios en el estado
  login: (code: string, password: string, terminalId: string) => Promise<boolean>;
  logout: () => void;
  updateLastActivity: () => void;
  checkSessionTimeout: () => void;
  isUserActiveInOtherTerminal: (userId: string, currentTerminalId: string) => boolean;
  updateUsers: (users: User[]) => void; // ✅ NUEVO: Función para actualizar usuarios
  addUser: (user: Omit<User, 'id'>) => void; // ✅ NUEVO: Agregar usuario
  updateUser: (id: string, updates: Partial<User>) => void; // ✅ NUEVO: Actualizar usuario
  deleteUser: (id: string) => void; // ✅ NUEVO: Eliminar usuario
}

// ✅ Datos iniciales de usuarios (solo para primera carga)
const initialUsers: User[] = [
  {
    id: '1',
    code: '1001',
    name: 'Juan Pérez',
    role: 'employee',
    isActive: true,
    password: '1234'
  },
  {
    id: '2',
    code: '2001',
    name: 'María García',
    role: 'employee',
    isActive: true,
    password: '1234'
  },
  {
    id: '3',
    code: '9999',
    name: 'Carlos Admin',
    role: 'admin',
    isActive: true,
    password: 'admin123'
  }
];

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      sessions: [],
      isAuthenticated: false,
      users: initialUsers, // ✅ NUEVO: Usuarios en el estado

      
      login: async (code: string, password: string, terminalId: string): Promise<boolean> => {
        const state = get();
        const user = state.users.find(u => u.code === code);
        
        if (!user) {
          return false;
        }

        // ✅ NUEVO: Validar si el usuario está activo
        if (!user.isActive) {
          throw new Error('Usuario inactivo. Contacte con administración');
        }

        // ✅ Validar contraseña
        if (user.password !== password) {
          return false;
        }

        // Verificar si está activo en otro terminal
        if (state.isUserActiveInOtherTerminal(user.id, terminalId)) {
          throw new Error('El empleado ya está activo en otro terminal');
        }

        // Crear una nueva sesión
        const newSession: Session = {
          terminalId,
          employeeId: user.id,
          startTime: new Date(),
          lastActivity: new Date(),
          isActive: true
        };

        set(state => ({
          currentUser: { ...user, terminalId, lastLogin: new Date() },
          sessions: [...state.sessions.filter(s => s.terminalId !== terminalId), newSession],
          isAuthenticated: true
        }));

        return true;
      },

      logout: () => {
        const state = get();
        if (state.currentUser?.terminalId) {
          set(prevState => ({
            currentUser: null,
            isAuthenticated: false,
            sessions: prevState.sessions.map(s => 
              s.terminalId === state.currentUser?.terminalId 
                ? { ...s, isActive: false }
                : s
            )
          }));
        }
      },

      updateLastActivity: () => {
        const state = get();
        if (state.currentUser?.terminalId) {
          set(prevState => ({
            sessions: prevState.sessions.map(s =>
              s.terminalId === state.currentUser?.terminalId
                ? { ...s, lastActivity: new Date() }
                : s
            )
          }));
        }
      },

      checkSessionTimeout: () => {
        const state = get();
        const now = new Date();
        const timeoutMinutes = 20;

        state.sessions.forEach(session => {
          if (session.isActive) {
            const minutesSinceLastActivity = (now.getTime() - session.lastActivity.getTime()) / (1000 * 60);
            
            if (minutesSinceLastActivity >= timeoutMinutes) {
              if (state.currentUser?.terminalId === session.terminalId) {
                get().logout();
                alert('Sesión cerrada por inactividad');
              }
            }
          }
        });
      },

      isUserActiveInOtherTerminal: (userId: string, currentTerminalId: string): boolean => {
        const state = get();
        return state.sessions.some(s => 
          s.employeeId === userId && 
          s.terminalId !== currentTerminalId && 
          s.isActive
        );
      },

      // ✅ NUEVO: Funciones para gestionar usuarios
      updateUsers: (users: User[]) => {
        set({ users });
      },

      addUser: (userData) => {
        const newUser: User = {
          ...userData,
          id: Date.now().toString()
        };
        set(state => ({
          users: [...state.users, newUser]
        }));
      },

      updateUser: (id: string, updates: Partial<User>) => {
        set(state => ({
          users: state.users.map(user => 
            user.id === id ? { ...user, ...updates } : user
          )
        }));
      },

      deleteUser: (id: string) => {
        set(state => ({
          users: state.users.filter(user => user.id !== id)
        }));
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        currentUser: state.currentUser,
        sessions: state.sessions,
        isAuthenticated: state.isAuthenticated,
        users: state.users // ✅ NUEVO: Persistir usuarios
      })
    }
  )
);