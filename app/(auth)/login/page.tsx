'use client';
import React from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function Login(){
  const [email, setEmail] = React.useState('');
  const [pass, setPass] = React.useState('');
  const [showPass, setShowPass] = React.useState(false);

  async function submit(){ 
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass }); 
    console.log('data:', data, 'error:', error);
    if(error) alert(error.message); 
    else window.location.replace('/dashboard'); 
  }

  return (
    <div className="container" style={{display:'grid', placeItems:'center', height:'100vh'}}>
      <div className="card" style={{width:380}}>
        <h1 className="h1">Autentificare</h1>
        <input className="input" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)}/>
        <div style={{height:8}}/>
        <div style={{position:'relative'}}>
          <input className="input" type={showPass ? 'text' : 'password'} placeholder="Parolă" value={pass} onChange={e=>setPass(e.target.value)} style={{paddingRight:36, width:'100%'}}/>
          <button type="button" onClick={()=>setShowPass(!showPass)} style={{position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#6B7280', fontSize:16}}>
            {showPass ? '🙈' : '👁️'}
          </button>
        </div>
        <div style={{height:6}}/>
        <div style={{textAlign:'right', fontSize:13}}>
          <a href="/forgot-password" style={{color:'#4F46E5', fontWeight:700}}>Ai uitat parola?</a>
        </div>
        <div style={{height:10}}/>
        <button className="btn" onClick={submit}>Intră în cont</button>
      </div>
      <div style={{ marginTop: 16, textAlign: 'center', fontSize: 13 }}>
        Nu ai cont? <a href="/register" style={{ color: '#4F46E5', fontWeight: 700 }}>Înregistrează-te</a>
      </div>
    </div>
  );
}