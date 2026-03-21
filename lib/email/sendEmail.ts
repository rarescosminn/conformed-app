// lib/email/sendEmail.ts
// ================================================================
// Helper pentru trimiterea emailurilor via API route /api/email/send
// ================================================================

type EmailType = 'welcome' | 'activare_cont' | 'transfer_admin';

type EmailPayload =
  | { type: 'welcome'; to: string; data: { denumire: string; org_type: string } }
  | { type: 'activare_cont'; to: string; data: { nume: string; prenume: string; organizatie: string } }
  | { type: 'transfer_admin'; to: string; data: { nume_vechi: string; nume_nou: string; organizatie: string } };

export async function sendEmail(payload: EmailPayload): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch('/api/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      return { success: false, error: data.error ?? 'Eroare la trimitere email.' };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: 'Eroare de rețea.' };
  }
}