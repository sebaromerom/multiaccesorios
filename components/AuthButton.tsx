'use client';

import { signIn, signOut } from 'next-auth/react';

interface AuthButtonProps {
  isLoggedIn: boolean;
  isAdmin: boolean;
}

export default function AuthButton({ isLoggedIn, isAdmin }: AuthButtonProps) {
  if (isLoggedIn) {
    return (
      <div className="flex items-center gap-2">
        {isAdmin && (
          <a href="/admin">
            <button className="bg-zinc-900 text-white text-[10px] font-black tracking-widest uppercase px-4 py-2.5 border-2 border-black shadow-[3px_3px_0px_0px_rgba(220,38,38,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all">
              Panel Admin
            </button>
          </a>
        )}
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="bg-white text-black text-[10px] font-black tracking-widest uppercase px-3 py-2.5 border-2 border-black hover:bg-zinc-100 transition-all"
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => signIn(undefined, { callbackUrl: '/admin' })}
      className="bg-white text-black text-[9px] font-bold tracking-widest uppercase px-3 py-2 border-2 border-black opacity-40 hover:opacity-100 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
    >
      🔒 Acceso
    </button>
  );
}