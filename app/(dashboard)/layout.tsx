// app/(dashboard)/layout.tsx
import RoleSidebar from "@/components/RoleSidebar";
import type { ReactNode } from "react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
    return (
        <div className="layout">
            <RoleSidebar />
            <main className="main">{children}</main>
        </div>
    );
}