'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';

const ADMIN_EMAIL = 'contact@econformed.io';
const FUNCTII_PROTEJATE = ['CEO / Director General', 'Manager General'];

// Plan limits
const PLAN_LIMITS: Record<string, number> = {
  demo: 1,
  baza: 3,
  platit: 10,
};

// ---- STYLES ----
const inp: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: 10,
  border: '1.5px solid #e5e7eb', fontSize: 14,
  boxSizing: 'border-box', background: '#fff',
};
const lbl: React.CSSProperties = {
  fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 5, color: '#374151',
};
const card: React.CSSProperties = {
  background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb',
  padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.05)', marginBottom: 20,
};
const btnPrimary: React.CSSProperties = {
  padding: '10px 20px', borderRadius: 10, border: 'none',
  background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
  color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
};
const btnDanger: React.CSSProperties = {
  padding: '8px 14px', borderRadius: 8, border: 'none',
  background: '#FEF2F2', color: '#991B1B',
  fontSize: 13, fontWeight: 600, cursor: 'pointer',
};
const btnSecondary: React.CSSProperties = {
  padding: '8px 14px', borderRadius: 8,
  border: '1px solid #e5e7eb', background: '#fff',
  color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer',
};

type UserProfile = {
  id: string;
  user_id: string;
  email?: string;
  nume?: string;
  prenume?: string;
  functie?: string;
  rol: string;
  este_protejat: boolean;
  admin_since?: string;
  last_admin_transfer?: string;
  created_at: string;
};

type OrgSettings = {
  plan_type: string;
  max_users: number;
  demo_expires_at: string;
};

export default function AdminPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [currentEmail, setCurrentEmail] = useState('');
  const [currentUserId, setCurrentUserId] = useState('');
  const [currentProfile, setCurrentProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [orgId, setOrgId] = useState('');
  const [orgSettings, setOrgSettings] = useState<OrgSettings | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Form nou user
  const [newNume, setNewNume] = useState('');
  const [newPrenume, setNewPrenume] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newFunctie, setNewFunctie] = useState('');
  const [newFunctieCustom, setNewFunctieCustom] = useState('');
  const [newRol, setNewRol] = useState('utilizator');
  const [newMsg, setNewMsg] = useState('');
  const [newLoading, setNewLoading] = useState(false);

  // Transfer admin
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferTarget, setTransferTarget] = useState('');
  const [transferMsg, setTransferMsg] = useState('');
  const [transferLoading, setTransferLoading] = useState(false);

  // Reset parolă
  const [resetMsg, setResetMsg] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setCurrentEmail(user.email ?? '');
    setCurrentUserId(user.id);

    // Org
    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!org) { setLoading(false); return; }
    setOrgId(org.id);

    // Profile curent
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    setCurrentProfile(profile);
    setIsAdmin(
      user.email === ADMIN_EMAIL ||
      profile?.rol === 'admin' ||
      (profile?.este_protejat === true)
    );

    // Setări org
    const { data: settings } = await supabase
      .from('setari_org')
      .select('*')
      .eq('org_id', org.id)
      .maybeSingle();

    if (settings) {
      setOrgSettings(settings);
    } else {
      // Creare setări default dacă nu există
      await supabase.from('setari_org').insert({
        org_id: org.id,
        plan_type: 'demo',
        max_users: 1,
      });
      setOrgSettings({ plan_type: 'demo', max_users: 1, demo_expires_at: '' });
    }

    // Useri din org
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('org_id', org.id)
      .order('created_at', { ascending: true });

    setUsers(profiles ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ---- CREARE USER NOU ----
  async function createUser() {
    if (!newEmail.includes('@')) return setNewMsg('Email invalid.');
    if (!newNume.trim() || !newPrenume.trim()) return setNewMsg('Nume și prenume obligatorii.');
    if (!newFunctie) return setNewMsg('Selectează funcția.');

    const functieFinala = newFunctie === 'alta' ? newFunctieCustom.trim() : newFunctie;
    if (!functieFinala) return setNewMsg('Specifică funcția.');

    const maxUsers = orgSettings ? PLAN_LIMITS[orgSettings.plan_type] ?? 1 : 1;
    if (users.length >= maxUsers) {
      return setNewMsg(`Limita de ${maxUsers} cont(uri) pentru planul ${orgSettings?.plan_type} a fost atinsă.`);
    }

    setNewLoading(true); setNewMsg('');

    const { data, error } = await supabase.auth.signUp({
      email: newEmail,
      password: Math.random().toString(36).slice(-10) + 'A1!',
      options: { emailRedirectTo: 'https://app.econformed.io/login' },
    });

    if (error) { setNewLoading(false); return setNewMsg(error.message); }

    const userId = data.user?.id;
    if (!userId) { setNewLoading(false); return setNewMsg('Eroare: user ID lipsă.'); }

    const esteProtejat = FUNCTII_PROTEJATE.includes(functieFinala);

    await supabase.from('user_profiles').insert({
      user_id: userId,
      org_id: orgId,
      nume: newNume.trim(),
      prenume: newPrenume.trim(),
      functie: functieFinala,
      rol: newRol,
      este_protejat: esteProtejat,
    });

    await supabase.auth.resetPasswordForEmail(newEmail, {
      redirectTo: 'https://app.econformed.io/reset-password',
    });

    setNewMsg(`✅ Cont creat pentru ${newEmail}. Email de activare trimis.`);
    setNewNume(''); setNewPrenume(''); setNewEmail('');
    setNewFunctie(''); setNewFunctieCustom(''); setNewRol('utilizator');
    await loadData();
    setNewLoading(false);
  }

  // ---- ȘTERGERE USER ----
  async function deleteUser(profile: UserProfile) {
    if (profile.este_protejat) return;
    if (profile.user_id === currentUserId) return;
    if (!confirm(`Ștergi contul ${profile.email ?? profile.prenume + ' ' + profile.nume}?`)) return;

    await supabase.from('user_profiles').delete().eq('id', profile.id);
    await loadData();
  }

  // ---- RESET PAROLĂ ----
  async function resetPassword(email: string) {
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://app.econformed.io/reset-password',
    });
    setResetMsg(`✅ Email de resetare trimis la ${email}`);
    setTimeout(() => setResetMsg(''), 4000);
  }

  // ---- TRANSFER ADMIN ----
  async function transferAdmin() {
    if (!transferTarget) return setTransferMsg('Selectează userul.');

    // Verifică timeri
    if (currentProfile?.last_admin_transfer) {
      const lastTransfer = new Date(currentProfile.last_admin_transfer);
      const hoursSince = (Date.now() - lastTransfer.getTime()) / (1000 * 60 * 60);
      if (hoursSince < 48) {
        return setTransferMsg(`Nu poți transfera în mai puțin de 48h de la ultima schimbare. Mai ai ${Math.ceil(48 - hoursSince)} ore.`);
      }
    }

    setTransferLoading(true);

    // Noul admin
    await supabase.from('user_profiles').update({
      rol: 'admin',
      admin_since: new Date().toISOString(),
    }).eq('user_id', transferTarget);

    // Userul curent pierde admin
    await supabase.from('user_profiles').update({
      rol: 'manager',
      last_admin_transfer: new Date().toISOString(),
    }).eq('user_id', currentUserId);

    setTransferMsg('✅ Rol admin transferat. Ești acum Manager.');
    setShowTransfer(false);
    setTransferLoading(false);
    await loadData();
  }

  // ---- RENDER ----
  if (isAdmin === null || loading) return (
    <div style={{ display: 'grid', placeItems: 'center', minHeight: '60vh' }}>
      <div style={{ fontSize: 14, color: '#6B7280' }}>Se încarcă...</div>
    </div>
  );

  if (!isAdmin) return (
    <div style={{ display: 'grid', placeItems: 'center', minHeight: '60vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🚫</div>
        <h2>Acces interzis</h2>
        <p style={{ color: '#6B7280' }}>Această pagină este disponibilă doar administratorului.</p>
      </div>
    </div>
  );

  const maxUsers = orgSettings ? PLAN_LIMITS[orgSettings.plan_type] ?? 1 : 1;
  const canAddUsers = users.length < maxUsers;

  return (
    <div style={{ maxWidth: 700, margin: '32px auto', padding: '0 16px' }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Panou Admin</h1>
      <p style={{ color: '#6B7280', fontSize: 14, marginBottom: 24 }}>
        Gestionează conturile și rolurile din organizație.
      </p>

      {/* Plan info */}
      <div style={{ ...card, background: '#EEF2FF', border: '1px solid #C7D2FE' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontWeight: 700, color: '#3730A3', fontSize: 15 }}>
              Plan: {orgSettings?.plan_type?.toUpperCase() ?? 'DEMO'}
            </div>
            <div style={{ fontSize: 13, color: '#6366F1', marginTop: 2 }}>
              {users.length} / {maxUsers} conturi utilizate
            </div>
          </div>
          {orgSettings?.demo_expires_at && (
            <div style={{ fontSize: 12, color: '#6366F1' }}>
              Demo expiră: {new Date(orgSettings.demo_expires_at).toLocaleDateString('ro-RO')}
            </div>
          )}
        </div>
      </div>

      {/* Lista useri */}
      <div style={card}>
        <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 16 }}>
          Conturi active ({users.length})
        </h2>

        {resetMsg && (
          <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', color: '#166534', padding: '10px 14px', borderRadius: 10, fontSize: 13, marginBottom: 12 }}>
            {resetMsg}
          </div>
        )}

        {users.length === 0 ? (
          <div style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center', padding: 24 }}>
            Nu există conturi în organizație.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {users.map(u => (
              <div key={u.id} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 16px', borderRadius: 12,
                border: '1px solid #f3f4f6', background: '#fafafa',
                flexWrap: 'wrap',
              }}>
                {/* Avatar inițiale */}
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                  background: u.este_protejat
                    ? 'linear-gradient(135deg, #059669, #047857)'
                    : u.rol === 'admin'
                    ? 'linear-gradient(135deg, #4F46E5, #7C3AED)'
                    : '#e5e7eb',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: u.este_protejat || u.rol === 'admin' ? '#fff' : '#6B7280',
                  fontWeight: 800, fontSize: 13,
                }}>
                  {u.prenume?.charAt(0)}{u.nume?.charAt(0)}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>
                    {u.prenume} {u.nume}
                    {u.este_protejat && (
                      <span style={{ marginLeft: 6, fontSize: 11, background: '#ECFDF5', color: '#059669', padding: '2px 8px', borderRadius: 99, fontWeight: 600 }}>
                        Protejat
                      </span>
                    )}
                    {u.rol === 'admin' && !u.este_protejat && (
                      <span style={{ marginLeft: 6, fontSize: 11, background: '#EEF2FF', color: '#4F46E5', padding: '2px 8px', borderRadius: 99, fontWeight: 600 }}>
                        Admin
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: '#6B7280' }}>
                    {u.functie ?? '—'} · {u.rol}
                  </div>
                </div>

                {/* Acțiuni */}
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  {!u.este_protejat && u.user_id !== currentUserId && (
                    <>
                      <button
                        onClick={() => u.email && resetPassword(u.email)}
                        style={btnSecondary}
                        title="Resetează parola"
                      >
                        Reset parolă
                      </button>
                      <button
                        onClick={() => deleteUser(u)}
                        style={btnDanger}
                        title="Șterge contul"
                      >
                        Șterge
                      </button>
                    </>
                  )}
                  {u.user_id === currentUserId && (
                    <span style={{ fontSize: 12, color: '#9CA3AF' }}>Tu</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Transfer admin */}
      {currentProfile?.rol === 'admin' && users.length > 1 && (
        <div style={card}>
          <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>Transfer rol Admin</h2>
          <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 16 }}>
            După transfer, pierzi rolul de Admin imediat. Noul admin nu poate transfera mai departe în primele 48h.
          </p>

          {!showTransfer ? (
            <button onClick={() => setShowTransfer(true)} style={btnSecondary}>
              Transferă rolul de Admin →
            </button>
          ) : (
            <div style={{ background: '#FFFBEB', border: '1.5px solid #FCD34D', borderRadius: 12, padding: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#92400E', marginBottom: 12 }}>
                ⚠️ Atenție — această acțiune este ireversibilă pentru 30 zile
              </div>

              <label style={lbl}>Selectează noul Admin</label>
              <select
                style={{ ...inp, marginBottom: 12 }}
                value={transferTarget}
                onChange={e => setTransferTarget(e.target.value)}
              >
                <option value="">— Selectează userul —</option>
                {users
                  .filter(u => u.user_id !== currentUserId)
                  .map(u => (
                    <option key={u.user_id} value={u.user_id}>
                      {u.prenume} {u.nume} ({u.functie})
                    </option>
                  ))}
              </select>

              {transferMsg && (
                <div style={{ fontSize: 13, color: transferMsg.startsWith('✅') ? '#166534' : '#991B1B', marginBottom: 12 }}>
                  {transferMsg}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => { setShowTransfer(false); setTransferMsg(''); }} style={btnSecondary}>
                  Renunț
                </button>
                <button
                  onClick={transferAdmin}
                  disabled={transferLoading || !transferTarget}
                  style={{ ...btnPrimary, background: '#D97706' }}
                >
                  {transferLoading ? 'Se procesează...' : 'Confirmă transferul'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Creare cont nou */}
      {canAddUsers ? (
        <div style={card}>
          <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>Adaugă cont nou</h2>
          <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 20 }}>
            Userul va primi email de activare și setare parolă.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={lbl}>Nume *</label>
              <input style={inp} placeholder="Popescu" value={newNume} onChange={e => setNewNume(e.target.value)} />
            </div>
            <div>
              <label style={lbl}>Prenume *</label>
              <input style={inp} placeholder="Ion" value={newPrenume} onChange={e => setNewPrenume(e.target.value)} />
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={lbl}>Email *</label>
            <input style={inp} type="email" placeholder="ion@companie.ro" value={newEmail} onChange={e => setNewEmail(e.target.value)} />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={lbl}>Funcție *</label>
            <select style={inp} value={newFunctie} onChange={e => setNewFunctie(e.target.value)}>
              <option value="">Selectează funcția</option>
              <option value="Administrator">Administrator</option>
              <option value="CEO / Director General">CEO / Director General</option>
              <option value="Manager General">Manager General</option>
              <option value="Manager">Manager</option>
              <option value="alta">Altă funcție...</option>
            </select>
          </div>

          {newFunctie === 'alta' && (
            <div style={{ marginBottom: 12 }}>
              <label style={lbl}>Specifică funcția</label>
              <input style={inp} placeholder="Ex: Director Financiar" value={newFunctieCustom} onChange={e => setNewFunctieCustom(e.target.value)} />
            </div>
          )}

          {(newFunctie === 'CEO / Director General' || newFunctie === 'Manager General') && (
            <div style={{ background: '#ECFDF5', border: '1px solid #BBF7D0', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#166534', marginBottom: 12 }}>
              ℹ️ Funcție protejată — acest cont va avea acces complet și nu poate fi șters de Admin.
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <label style={lbl}>Rol platformă</label>
            <select style={inp} value={newRol} onChange={e => setNewRol(e.target.value)}>
              <option value="utilizator">Utilizator</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {newMsg && (
            <div style={{
              background: newMsg.startsWith('✅') ? '#F0FDF4' : '#FEF2F2',
              border: `1px solid ${newMsg.startsWith('✅') ? '#BBF7D0' : '#FECACA'}`,
              color: newMsg.startsWith('✅') ? '#166534' : '#991B1B',
              padding: '10px 14px', borderRadius: 10, fontSize: 13, marginBottom: 12,
            }}>
              {newMsg}
            </div>
          )}

          <button onClick={createUser} disabled={newLoading} style={btnPrimary}>
            {newLoading ? 'Se creează...' : 'Creează cont și trimite email activare'}
          </button>
        </div>
      ) : (
        <div style={{ ...card, background: '#FEF2F2', border: '1px solid #FECACA' }}>
          <div style={{ fontWeight: 700, color: '#991B1B', marginBottom: 6 }}>Limită atinsă</div>
          <p style={{ fontSize: 13, color: '#B91C1C', margin: 0 }}>
            Planul {orgSettings?.plan_type} permite maxim {maxUsers} cont(uri).
            Pentru mai multe conturi, upgradează planul.
          </p>
        </div>
      )}

    </div>
  );
}