// app/layout.tsx
import "@/styles/globals.css";
import RoleSidebar from "@/components/RoleSidebar";
import type { ReactNode } from "react";

export const metadata = { title: 'ConforMed' };

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="ro">
            <head>
                <link rel="manifest" href="/manifest.json" />
            </head>
            <body>
                <div className="layout">
                    <RoleSidebar />
                    <main className="main">{children}</main>
                </div>
            </body>
        </html>
    );
}
