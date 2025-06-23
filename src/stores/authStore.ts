import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Session, User } from '../types';

interface AuthState {
  currentUser: User | null;
  sessions: Session[];
  isAuthenticated: boolean;
  login: (code: string, terminalId: string) => Promise<boolean>;
  logout: () => void;
  updateLastActivity: () => void;
  checkSessionTimeout: () => void;
  isUserActiveInOtherTerminal: (userId: string, currentTerminalId: string) => boolean;
}

// Mock users data
const mockUsers: User[] = [
  {
    id: '1',
    code: '1001',
    name: 'Juan Pérez',
    role: 'employee',
    isActive: true
  },
  {
    id: '2',
    code: '2001',
    name: 'María García',
    role: 'employee',
    isActive: true
  },
  {
    id: '3',
    code: '9999',
    name: 'Carlos Admin',
    role: 'admin',
    isActive: true
  }
];

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      sessions: [],
      isAuthenticated: false,

      login: async (code: string, terminalId: string): Promise<boolean> => {
        const user = mockUsers.find(u => u.code === code && u.isActive);
        
        if (!user) {
          return false;
        }

        // Check if user is already active in another terminal
        const state = get();
        if (state.isUserActiveInOtherTerminal(user.id, terminalId)) {
          alert('El empleado ya está activo en otro terminal');
          return false;
        }

        // Create new session
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