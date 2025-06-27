import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, Session } from "../types";

interface AuthState {
  currentUser: User | null;
  sessions: Session[];
  isAuthenticated: boolean;

  login: (code: string, terminalId: string) => Promise<boolean>;
  logout: () => void;
  updateLastActivity: () => void;
  checkSessionTimeout: () => void;
  getSecondsLeft: () => number;
  isUserActiveInOtherTerminal: (
    userId: string,
    currentTerminalId: string
  ) => boolean;
}

// Mock users data
const mockUsers: User[] = [
  {
    id: "1",
    code: "1001",
    name: "Juan Pérez",
    role: "employee",
    isActive: true,
  },
  {
    id: "2",
    code: "2001",
    name: "María García",
    role: "employee",
    isActive: true,
  },
  {
    id: "3",
    code: "9999",
    name: "Carlos Admin",
    role: "admin",
    isActive: true,
  },
];

const SESSION_TIMEOUT_SECONDS = 1200;

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      sessions: [],
      isAuthenticated: false,

      login: async (code: string, terminalId: string): Promise<boolean> => {
        const user = mockUsers.find((u) => u.code === code && u.isActive);
        if (!user) return false;

        const state = get();
        if (state.isUserActiveInOtherTerminal(user.id, terminalId)) {
          alert("El empleado ya está activo en otro terminal");
          return false;
        }

        const newSession = {
          terminalId,
          employeeId: user.id,
          startTime: new Date(),
          lastActivity: new Date(),
          isActive: true,
        };

        set((prev) => ({
          currentUser: { ...user, terminalId, lastLogin: new Date() },
          sessions: [
            ...prev.sessions.filter((s) => s.terminalId !== terminalId),
            newSession,
          ],
          isAuthenticated: true,
        }));

        return true;
      },

      logout: () => {
        const state = get();
        if (state.currentUser?.terminalId) {
          set((prev) => ({
            currentUser: null,
            isAuthenticated: false,
            sessions: prev.sessions.map((s) =>
              s.terminalId === state.currentUser?.terminalId
                ? { ...s, isActive: false }
                : s
            ),
          }));
        }
      },

      updateLastActivity: () => {
        const state = get();
        if (state.currentUser?.terminalId) {
          set((prev) => ({
            sessions: prev.sessions.map((s) =>
              s.terminalId === state.currentUser?.terminalId
                ? { ...s, lastActivity: new Date() }
                : s
            ),
          }));
        }
      },

      checkSessionTimeout: () => {
        const state = get();
        const now = new Date();

        const timeoutSeconds = SESSION_TIMEOUT_SECONDS;

        state.sessions.forEach((session) => {
          if (session.isActive) {
            let lastActivity = session.lastActivity;

            if (typeof lastActivity === "string") {
              lastActivity = new Date(lastActivity);
            }

            const diffInMs = now.getTime() - lastActivity.getTime();
            const secondsSinceLastActivity = Math.floor(diffInMs / 1000);

            console.log(secondsSinceLastActivity);
            if (secondsSinceLastActivity >= timeoutSeconds) {
              if (state.currentUser?.terminalId === session.terminalId) {
                get().logout();
                alert("Sesión cerrada por inactividad");
              }
            }
          }
        });
      },

      getSecondsLeft: () => {
        const state = get();
        if (!state.currentUser) return 0;

        const session = state.sessions.find(
          (s) => s.terminalId === state.currentUser?.terminalId && s.isActive
        );

        if (!session) return 0;

        let lastActivity = session.lastActivity;
        if (typeof lastActivity === "string") {
          lastActivity = new Date(lastActivity);
        }

        const now = new Date();
        const diffInMs = now.getTime() - lastActivity.getTime();
        const secondsSinceLastActivity = Math.floor(diffInMs / 1000);
        const secondsLeft = Math.max(
          0,
          SESSION_TIMEOUT_SECONDS - secondsSinceLastActivity
        );

        return secondsLeft;
      },

      isUserActiveInOtherTerminal: (
        userId: string,
        currentTerminalId: string
      ): boolean => {
        const state = get();

        return state.sessions.some((s) => {
          let lastActivity = s.lastActivity;
          if (typeof lastActivity === "string") {
            lastActivity = new Date(lastActivity);
          }

          return (
            s.employeeId === userId &&
            s.terminalId !== currentTerminalId &&
            s.isActive
          );
        });
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        currentUser: state.currentUser,
        sessions: state.sessions.map((s) => ({
          ...s,
          lastActivity:
            s.lastActivity instanceof Date
              ? s.lastActivity.toISOString()
              : new Date(s.lastActivity).toISOString(),
        })),
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
