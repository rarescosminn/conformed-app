// app/layout.tsx
import "@/styles/globals.css";
import RoleSidebar from "@/components/RoleSidebar";
import type { ReactNode } from "react";

export const metadata = { 
  title: 'eConformed',
  description: 'Platformă SaaS pentru conformare ISO, ESG și trasabilitate operațională.',
  icons: { icon: '/favicon.ico' }
};

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
