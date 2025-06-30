import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Session } from '../types';

interface AuthState {
  currentUser: User | null;
  sessions: Session[];
  isAuthenticated: boolean;
  users: User[]; 
  login: (code: string, password: string, terminalId: string) => Promise<boolean>;
  logout: () => void;
  updateLastActivity: () => void;
  checkSessionTimeout: () => void;
  isUserActiveInOtherTerminal: (userId: string, currentTerminalId: string) => boolean;
  updateUsers: (users: User[]) => void; 
  addUser: (user: Omit<User, 'id'>) => void; 
  updateUser: (id: string, updates: Partial<User>) => void; 
  deleteUser: (id: string) => void; 
  getSecondsLeft: () => number;
}


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

const SESSION_TIMEOUT_SECONDS = 10; 

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      sessions: [],
      isAuthenticated: false,
      users: initialUsers, 

      
      login: async (code: string, password: string, terminalId: string): Promise<boolean> => {
        const state = get();
        const user = state.users.find(u => u.code === code);
        
        if (!user) {
          return false;
        }

        
        if (!user.isActive) {
          throw new Error('Usuario inactivo. Contacte con administración');
        }

        
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

       getSecondsLeft: () => {
        const state = get();
        if (!state.currentUser) return 0;

        const session = state.sessions.find(
          s => s.terminalId === state.currentUser?.terminalId && s.isActive
        );

        if (!session) return 0;

        let lastActivity = session.lastActivity;
        if (typeof lastActivity === 'string') {
          lastActivity = new Date(lastActivity);
        }

        const now = new Date();
        const diffInMs = now.getTime() - lastActivity.getTime();
        const secondsSinceLastActivity = Math.floor(diffInMs / 1000);
        const secondsLeft = Math.max(0, SESSION_TIMEOUT_SECONDS - secondsSinceLastActivity);

        return secondsLeft;
      },

      checkSessionTimeout: () => {
        const state = get();
        const now = new Date();

        const timeoutSeconds = SESSION_TIMEOUT_SECONDS;

        state.sessions.forEach(session => {
          if (session.isActive) {
            let lastActivity = session.lastActivity;

            if (typeof lastActivity === 'string') {
              lastActivity = new Date(lastActivity);
            }

            const diffInMs = now.getTime() - lastActivity.getTime();
            const secondsSinceLastActivity = Math.floor(diffInMs / 1000);

            console.log(secondsSinceLastActivity)
            if (secondsSinceLastActivity >= timeoutSeconds) {
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
        users: state.users 
      })
    }
  )
);