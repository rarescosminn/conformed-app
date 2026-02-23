// store/useProfileStore.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type ProfileState = {
    name: string;
    email?: string;
    avatarUrl?: string;
    avatarSeed?: string;
    setProfile: (p: Partial<ProfileState>) => void;
    clearAvatar: () => void;
};

export const useProfileStore = create<ProfileState>()(
    persist(
        (set) => ({
            name: "Utilizator",
            email: "",
            avatarUrl: undefined,
            avatarSeed: undefined,
            setProfile: (p) => set(p),
            clearAvatar: () => set({ avatarUrl: undefined }),
        }),
        {
            name: "profile-store",
            storage: createJSONStorage(() => localStorage),
            partialize: (s) => ({
                name: s.name,
                email: s.email,
                avatarUrl: s.avatarUrl,
                avatarSeed: s.avatarSeed,
            }),
        }
    )
);
