'use client';
import React from 'react';
import { supabase } from '@/lib/supabaseClient';
export default function Login(){
  const [email,setEmail]=React.useState(''); const [pass,setPass]=React.useState('');
  async function submit(){ 
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass }); 
    console.log('data:', data, 'error:', error);
    if(error) alert(error.message); 
    else window.location.href='/dashboard'; 
  }
  return (<div className="container" style={{display:'grid', placeItems:'center', height:'100vh'}}>
    <div className="card" style={{width:380}}><h1 className="h1">Autentificare</h1>
      <input className="input" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)}/>
      <div style={{height:8}}/>
      <input className="input" type="password" placeholder="Parolă" value={pass} onChange={e=>setPass(e.target.value)}/>
      <div style={{height:12}}/>
      <button className="btn" onClick={submit}>Intră în cont</button>
    </div></div>);
}