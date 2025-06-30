import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Session } from '../types';

interface AuthState {
  currentUser: User | null;
  sessions: Session[];
  isAuthenticated: boolean;
  login: (code: string, password: string, terminalId: string) => Promise<boolean>;
  logout: () => void;
  updateLastActivity: () => void;
  checkSessionTimeout: () => void;
  isUserActiveInOtherTerminal: (userId: string, currentTerminalId: string) => boolean;
}

//  Datos de ejemplo para usuarios
const mockUsers: User[] = [
  {
    id: '1',
    code: '1001',
    name: 'Juan Pérez',
    role: 'employee',
    isActive: true,
    password: '1234' // Contraseña simple para demo
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

      login: async (code: string, password: string, terminalId: string): Promise<boolean> => {
        const user = mockUsers.find(u => u.code === code && u.isActive);
        
        if (!user) {
          return false;
        }

        if (user.password !== password) {
          return false;
        }

        // verificar si esta activo en otro terminal
        const state = get();
        if (state.isUserActiveInOtherTerminal(user.id, terminalId)) {
          alert('El empleado ya está activo en otro terminal');
          return false;
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
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        currentUser: state.currentUser,
        sessions: state.sessions,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);