import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { RoleType } from '@/types/workflow';

interface AppState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  activeRole: RoleType;
  setActiveRole: (role: RoleType) => void;

  // Active sub-workspace when activeRole === 'ROLE_DUAL_STAFF'
  dualRoleSubRole: 'ROLE_HEC_SCRUTINY' | 'ROLE_HEC_ATTESTATION';
  setDualRoleSubRole: (
    subRole: 'ROLE_HEC_SCRUTINY' | 'ROLE_HEC_ATTESTATION'
  ) => void;

  // Filter selection in application table
  selectedStatusFilter: string;
  setSelectedStatusFilter: (status: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      toggleSidebar: () =>
        set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),

      activeRole: 'ROLE_HEC_MANAGER',
      setActiveRole: (role: RoleType) =>
        set({
          activeRole: role,
          // Reset status filter upon role change
          selectedStatusFilter: 'ALL',
        }),

      dualRoleSubRole: 'ROLE_HEC_SCRUTINY',
      setDualRoleSubRole: (subRole) => set({ dualRoleSubRole: subRole }),

      selectedStatusFilter: 'ALL',
      setSelectedStatusFilter: (status: string) =>
        set({ selectedStatusFilter: status }),
    }),
    {
      name: 'hec-portal-session-storage',
    }
  )
);
