// app/layout.tsx
import "@/styles/globals.css";
import type { ReactNode } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: 'eConformed',
    template: '%s | eConformed',
  },
  description: 'Platformă SaaS pentru conformare ISO, ESG și trasabilitate operațională.',
  icons: {
    icon: [
      { url: '/eConformed_LOGO.png', type: 'image/png' },
      { url: '/favicon.ico', type: 'image/x-icon' },
    ],
    apple: '/eConformed_LOGO.png',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ro">
      <head>
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}