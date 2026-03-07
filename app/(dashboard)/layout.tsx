// app/(dashboard)/layout.tsx
import RoleSidebar from "@/components/RoleSidebar";
import { OrgProvider } from "@/lib/context/OrgContext";
import type { ReactNode } from "react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
    return (
        <OrgProvider>
            <div className="layout">
                <RoleSidebar />
                <main className="main">{children}</main>
            </div>
        </OrgProvider>
    );
}