import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Profile } from '@/types';

interface OfflineEntry {
  id: string;
  challengeId: string;
  participantId: string;
  entryDate: string;
  metricsData: Record<string, { status: string; value?: number }>;
  timestamp: number;
}

interface AppState {
  // User
  user: Profile | null;
  setUser: (user: Profile | null) => void;

  // Offline queue
  offlineQueue: OfflineEntry[];
  addToOfflineQueue: (entry: OfflineEntry) => void;
  removeFromOfflineQueue: (id: string) => void;
  clearOfflineQueue: () => void;

  // UI state
  isOnline: boolean;
  setIsOnline: (online: boolean) => void;

  // Active challenge ID for quick access
  activeChallengeId: string | null;
  setActiveChallengeId: (id: string | null) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // User
      user: null,
      setUser: (user) => set({ user }),

      // Offline queue
      offlineQueue: [],
      addToOfflineQueue: (entry) =>
        set((state) => ({
          offlineQueue: [...state.offlineQueue, entry],
        })),
      removeFromOfflineQueue: (id) =>
        set((state) => ({
          offlineQueue: state.offlineQueue.filter((e) => e.id !== id),
        })),
      clearOfflineQueue: () => set({ offlineQueue: [] }),

      // UI state
      isOnline: true,
      setIsOnline: (isOnline) => set({ isOnline }),

      // Active challenge
      activeChallengeId: null,
      setActiveChallengeId: (activeChallengeId) => set({ activeChallengeId }),
    }),
    {
      name: 'challenges-app-storage',
      partialize: (state) => ({
        offlineQueue: state.offlineQueue,
        activeChallengeId: state.activeChallengeId,
      }),
    }
  )
);
