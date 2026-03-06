'use client';

export default function Error({ error }: { error: Error }) {
  return (
    <div className="card" style={{ padding: 16, color: '#B91C1C' }}>
      <strong>Eroare:</strong> {error.message}
    </div>
  );
}
