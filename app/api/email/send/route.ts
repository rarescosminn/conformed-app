// app/api/email/send/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = 'eConformed <noreply@econformed.io>';

// ----------------------------------------------------------------
// TEMPLATE HELPERS
// ----------------------------------------------------------------
function baseTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>eConformed</title>
</head>
<body style="margin:0;padding:0;background:#f6f7fb;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f6f7fb;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
          
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#4F46E5,#7C3AED);border-radius:16px 16px 0 0;padding:32px;text-align:center;">
              <div style="font-size:28px;font-weight:900;color:#fff;letter-spacing:-1px;">
                e<span style="opacity:0.7">Conformed</span>
              </div>
              <div style="font-size:12px;color:rgba(255,255,255,0.6);margin-top:4px;letter-spacing:1px;">
                a Digital assistant for compliance and growth
              </div>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="background:#ffffff;padding:32px;border-radius:0 0 16px 16px;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
              ${content}
              
              <!-- Footer -->
              <div style="margin-top:32px;padding-top:24px;border-top:1px solid #f3f4f6;text-align:center;">
                <p style="margin:0;font-size:12px;color:#9CA3AF;">
                  © ${new Date().getFullYear()} eConformed · Golden Audit Consulting S.R.L.
                </p>
                <p style="margin:4px 0 0;font-size:12px;color:#9CA3AF;">
                  <a href="https://econformed.io" style="color:#6366F1;text-decoration:none;">econformed.io</a>
                </p>
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

function btnHtml(text: string, url: string): string {
  return `
    <div style="text-align:center;margin:24px 0;">
      <a href="${url}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#4F46E5,#7C3AED);color:#fff;font-weight:700;font-size:15px;border-radius:10px;text-decoration:none;box-shadow:0 4px 14px rgba(79,70,229,0.35);">
        ${text}
      </a>
    </div>
  `;
}

// ----------------------------------------------------------------
// TEMPLATES
// ----------------------------------------------------------------

function templateWelcome(denumire: string, orgType: string): string {
  const tipOrg =
    orgType === 'spital' ? 'Unitate Medicală' :
    orgType === 'institutie_publica' ? 'Instituție Publică' :
    'Companie Privată';

  return baseTemplate(`
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#111827;">
      Bun venit în eConformed! 🎉
    </h2>
    <p style="margin:0 0 20px;font-size:15px;color:#6B7280;line-height:1.6;">
      Platforma a fost configurată cu succes pentru <strong>${denumire}</strong> (${tipOrg}).
      Perioada ta de probă de <strong>90 de zile</strong> a început.
    </p>

    <div style="background:#EEF2FF;border-radius:12px;padding:20px;margin-bottom:20px;">
      <div style="font-weight:700;color:#3730A3;margin-bottom:12px;font-size:14px;">Ce poți face acum:</div>
      ${['Explorează modulele disponibile pentru organizația ta', 'Configurează angajații și departamentele în secțiunea HR', 'Verifică cerințele de conformare ISO & ESG', 'Adaugă documente și proceduri în bibliotecă'].map(item => `
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;font-size:14px;color:#4338CA;">
          <span style="color:#6366F1;">✓</span> ${item}
        </div>
      `).join('')}
    </div>

    ${btnHtml('Mergi la Dashboard →', 'https://app.econformed.io/dashboard')}

    <p style="margin:0;font-size:13px;color:#9CA3AF;text-align:center;">
      Ai nevoie de ajutor? Scrie-ne la <a href="mailto:contact@econformed.io" style="color:#6366F1;">contact@econformed.io</a>
    </p>
  `);
}

function templateActivareCont(nume: string, prenume: string, organizatie: string): string {
  return baseTemplate(`
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#111827;">
      Contul tău a fost creat
    </h2>
    <p style="margin:0 0 20px;font-size:15px;color:#6B7280;line-height:1.6;">
      Salut, <strong>${prenume} ${nume}</strong>! Administratorul organizației <strong>${organizatie}</strong> ți-a creat un cont în platforma eConformed.
    </p>

    <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:12px;padding:16px;margin-bottom:20px;">
      <div style="font-weight:700;color:#166534;margin-bottom:4px;font-size:14px;">Pași următori:</div>
      <div style="font-size:13px;color:#15803D;line-height:1.7;">
        1. Apasă butonul de mai jos pentru a-ți seta parola<br/>
        2. Loghează-te în platformă<br/>
        3. Explorează modulele disponibile
      </div>
    </div>

    ${btnHtml('Setează parola și activează contul →', 'https://app.econformed.io/reset-password')}

    <p style="margin:0;font-size:13px;color:#9CA3AF;text-align:center;">
      Link-ul expiră în 24 de ore. Dacă nu ai solicitat acest cont, ignoră acest email.
    </p>
  `);
}

function templateTransferAdmin(numeVechi: string, numeNou: string, organizatie: string): string {
  return baseTemplate(`
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#111827;">
      Rol Admin transferat
    </h2>
    <p style="margin:0 0 20px;font-size:15px;color:#6B7280;line-height:1.6;">
      Rolul de <strong>Administrator</strong> în organizația <strong>${organizatie}</strong> a fost transferat de la <strong>${numeVechi}</strong> către <strong>${numeNou}</strong>.
    </p>

    <div style="background:#FFFBEB;border:1px solid #FCD34D;border-radius:12px;padding:16px;margin-bottom:20px;">
      <div style="font-weight:700;color:#92400E;margin-bottom:8px;font-size:14px;">⚠️ Important de reținut:</div>
      <div style="font-size:13px;color:#78350F;line-height:1.7;">
        • Noul administrator nu poate transfera rolul mai departe în primele <strong>48 ore</strong><br/>
        • Revenirea la fostul administrator este posibilă doar după <strong>30 de zile</strong><br/>
        • Funcțiile protejate (CEO/DG/MG) pot modifica oricând rolurile
      </div>
    </div>

    ${btnHtml('Mergi la platformă →', 'https://app.econformed.io/dashboard')}

    <p style="margin:0;font-size:13px;color:#9CA3AF;text-align:center;">
      Dacă nu recunoști această acțiune, contactează-ne imediat la <a href="mailto:contact@econformed.io" style="color:#6366F1;">contact@econformed.io</a>
    </p>
  `);
}

// ----------------------------------------------------------------
// API ROUTE
// ----------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, to, data } = body;

    if (!type || !to) {
      return NextResponse.json({ error: 'Parametri lipsă: type, to' }, { status: 400 });
    }

    let subject = '';
    let html = '';

    switch (type) {
      case 'welcome':
        subject = `Bun venit în eConformed, ${data.denumire}! 🎉`;
        html = templateWelcome(data.denumire, data.org_type);
        break;

      case 'activare_cont':
        subject = `Contul tău eConformed a fost creat`;
        html = templateActivareCont(data.nume, data.prenume, data.organizatie);
        break;

      case 'transfer_admin':
        subject = `Rol Admin transferat — ${data.organizatie}`;
        html = templateTransferAdmin(data.nume_vechi, data.nume_nou, data.organizatie);
        break;

      default:
        return NextResponse.json({ error: `Tip email necunoscut: ${type}` }, { status: 400 });
    }

    const { data: result, error } = await resend.emails.send({
      from: FROM,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: result?.id });
  } catch (err) {
    console.error('Email route error:', err);
    return NextResponse.json({ error: 'Eroare internă' }, { status: 500 });
  }
}