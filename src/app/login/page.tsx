'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  return (
    <main className="min-h-screen bg-gradient-to-br from-white via-teal-50 to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-black flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl border-2 border-teal-500 shadow-2xl p-8">
        <div className="mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center">
              <span className="text-white font-bold text-2xl">🌍</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-center bg-gradient-to-r from-teal-600 to-teal-500 bg-clip-text text-transparent mb-2">Viajar</h1>
          <p className="text-center text-gray-600 dark:text-gray-400 text-sm">Share your travel recommendations</p>
        </div>
        
        <div className="space-y-4">
          <input 
            className="w-full p-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:border-teal-500 focus:outline-none transition-colors" 
            placeholder="Email"
            value={email} 
            onChange={e => setEmail(e.target.value)} 
          />
          <input 
            className="w-full p-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:border-teal-500 focus:outline-none transition-colors" 
            type="password" 
            placeholder="Password"
            value={password} 
            onChange={e => setPassword(e.target.value)} 
          />
        </div>
        
        <div className="flex gap-3 mt-6">
          <button 
            className="flex-1 bg-gradient-to-r from-teal-500 to-teal-600 text-white font-bold py-3 px-4 rounded-lg hover:shadow-lg hover:shadow-teal-500/50 transition-all transform hover:-translate-y-0.5"
            onClick={async () => {
              const { error } = await supabase.auth.signInWithPassword({ email, password });
              setMsg(error ? error.message : 'Logged in');
              if (!error) location.href = '/';
            }}
          >
            Login
          </button>
          <button 
            className="flex-1 bg-gray-900 dark:bg-gray-700 text-white font-bold py-3 px-4 rounded-lg border-2 border-coral hover:bg-coral transition-all transform hover:-translate-y-0.5"
            onClick={async () => {
              const { error } = await supabase.auth.signUp({ email, password });
              setMsg(error ? error.message : 'Check your email to confirm');
            }}
          >
            Sign up
          </button>
        </div>
        {msg && <p className="mt-4 text-sm p-3 bg-teal-50 dark:bg-gray-800 text-teal-700 dark:text-teal-400 rounded-lg text-center">{msg}</p>}
      </div>
    </main>
  );
}