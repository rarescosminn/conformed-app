'use client';
import { useRouter } from 'next/navigation';

export default function NotFound() {
  const router = useRouter();
  return (
    <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh', background: '#f7f8fb', padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 420 }}>
        <div style={{ fontSize: 80, marginBottom: 16 }}>404</div>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Pagina nu a fost găsită</h1>
        <p style={{ color: '#6B7280', marginBottom: 32 }}>
          Pagina pe care o cauți nu există sau a fost mutată.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button
            onClick={() => router.back()}
            style={{ padding: '10px 20px', borderRadius: 12, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontWeight: 600 }}
          >
            ← Înapoi
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            style={{ padding: '10px 20px', borderRadius: 12, border: 'none', background: '#4F46E5', color: '#fff', cursor: 'pointer', fontWeight: 600 }}
          >
            Acasă
          </button>
        </div>
      </div>
    </div>
  );
}