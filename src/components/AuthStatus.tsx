'use client';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { AnimatePresence, motion } from 'framer-motion';

type Phase = 'loading' | 'logged in' | 'logged out';

export default function AuthStatus() {
  const [phase, setPhase] = useState<Phase>('loading');
  const [user, setUser] = useState<User | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const prevPhase = useRef<Phase>('loading');
  const [mounted, setMounted] = useState(false); // portal target ready

  // Ensure client-side mounting for portal target (document.body)
  useEffect(() => setMounted(true), []);

  // Auth initialization and subscription
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    (async () => {
      // 1. Get initial session status
      const { data, error } = await supabase.auth.getSession();
      console.log('[AuthStatus] getSession:', { hasSession: !!data?.session, error });
      setUser(data?.session?.user ?? null);
      setPhase(data?.session ? 'logged in' : 'logged out');

      // 2. Set up listener for state changes
      const sub = supabase.auth.onAuthStateChange((event, session) => {
        console.log('[AuthStatus] onAuthStateChange:', { event, hasSession: !!session });
        setUser(session?.user ?? null);
        setPhase(session ? 'logged in' : 'logged out');
        if (session) setShowLogin(false);
      });
      
      // Setup cleanup function
      unsubscribe = () => sub.data.subscription.unsubscribe();
    })();

    return () => { if (unsubscribe) unsubscribe(); };
  }, []);

  // Control modal visibility based on auth state
  useEffect(() => {
    // Open modal whenever logged out; close when logged in
    if (phase === 'logged out') setShowLogin(true);
    if (phase === 'logged in') setShowLogin(false);
    prevPhase.current = phase;
  }, [phase]);

  // Prevent body scroll when modal open
  useEffect(() => {
    if (!showLogin) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [showLogin]);

  if (phase === 'loading') return <span>Loading...</span>;

  // Header content (small) - defined once for clarity
  const headerRight =
    phase === 'logged in' ? (
      <div className="flex items-center gap-4">
        <span className="text-base font-medium text-gray-700 dark:text-gray-300">Welcome, <span className="text-teal-600 font-semibold">{user?.email?.split('@')[0]}</span></span>
        <a href="/profile" className="text-base font-semibold text-gray-700 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 transition-colors">Profile</a>
        <button
          className="px-4 py-1.5 bg-gradient-to-r from-teal-500 to-teal-600 text-white text-base font-semibold rounded-lg hover:shadow-lg hover:shadow-teal-500/50 transition-all transform hover:-translate-y-0.5"
          onClick={() => supabase.auth.signOut()}
        >
          Sign out
        </button>
      </div>
    ) : (
      <button
        className="px-4 py-1.5 bg-gradient-to-r from-teal-500 to-teal-600 text-white text-base font-semibold rounded-lg hover:shadow-lg hover:shadow-teal-500/50 transition-all transform hover:-translate-y-0.5"
        onClick={() => setShowLogin(true)}
      >
        Login
      </button>
    );

  return (
    <>
      {headerRight}

      {/* Full-screen modal via portal; highest z-index to beat any stacking context */}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {showLogin && phase === 'logged out' && (
              <motion.div
                key="overlay"
                className="fixed inset-0 z-[9999] grid place-items-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* Backdrop */}
                <div
                  className="absolute inset-0 bg-black/70"
                  onClick={() => setShowLogin(false)}
                  aria-hidden
                />
                
                {/* Center card */}
                <motion.div
                  key="card"
                  className="relative w-[92vw] max-w-sm rounded-2xl border-2 border-teal-500 bg-white dark:bg-gray-900 p-8 shadow-2xl"
                  initial={{ y: -20, opacity: 0, scale: 0.98 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  exit={{ y: -10, opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
                  role="dialog"
                  aria-modal="true"
                  aria-label="Sign in"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-teal-500 bg-clip-text text-transparent">Sign in</h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Welcome to Viajar</p>
                    </div>
                    <button
                      className="text-2xl text-gray-500 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                      onClick={() => setShowLogin(false)}
                      aria-label="Close login"
                    >
                      ✕
                    </button>
                  </div>

                  <Auth
                    supabaseClient={supabase}
                    view="sign_in"
                    redirectTo={typeof window !== 'undefined' ? window.location.origin : undefined}
                    providers={['google']}
                    appearance={{
                      theme: ThemeSupa,
                      variables: {
                        default: {
                          colors: {
                            brand: '#20B2AA',
                            brandAccent: '#1a9a92',
                          // key overrides for teal theme:
                          inputText: '#1a1a1a', // dark text inside inputs
                          inputPlaceholder: '#9ca3af', // placeholder color
                          inputBackground: '#f5f5f5', // light background
                          inputBorder: '#20B2AA', // teal border
                          anchorTextColor: '#20B2AA',
                          },
                        },
                    },
                    className: {
                    // Tailwind classes for teal theme
                    input:
                      'text-gray-900 placeholder:text-gray-400 bg-gray-100 dark:bg-gray-800 dark:text-white border-2 border-teal-500 dark:border-teal-600 ' +
                      'focus:border-teal-600 focus:ring-teal-500 rounded-lg',
                    button: 'rounded-lg bg-gradient-to-r from-teal-500 to-teal-600 hover:shadow-lg hover:shadow-teal-500/50 font-semibold',
                    container: 'space-y-4',
                    label: 'text-sm font-semibold text-gray-900 dark:text-white',
                    anchor: 'text-sm text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 underline',
                    },
                }}
              />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
}