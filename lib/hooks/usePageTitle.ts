// lib/hooks/usePageTitle.ts
'use client';
import { useEffect } from 'react';

/**
 * Setează titlul paginii în browser pentru componente client.
 * Format: "Pagina | eConformed"
 * Folosit în paginile care au 'use client' și nu pot exporta metadata.
 */
export function usePageTitle(title: string) {
  useEffect(() => {
    document.title = `${title} | eConformed`;
    return () => {
      document.title = 'eConformed';
    };
  }, [title]);
}