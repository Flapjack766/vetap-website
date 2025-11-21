"use client";
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function CardsLogin({ locale }: { locale: 'ar' | 'en' | 'tr' }) {
  const router = useRouter();
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (user === 'moh' && pass === 'Aa@05524409044.com') {
        if (typeof window !== 'undefined') {
          window.sessionStorage.setItem('cardUser', user);
          window.sessionStorage.setItem('cardPass', pass);
        }
        router.replace(`/${locale}/cards/moh/page?edit=1`);
      } else {
        setError('Invalid credentials');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-md">
      <h1 className="text-xl font-semibold mb-6">Cards — Login</h1>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Username</label>
          <input className="w-full border rounded px-3 py-2" value={user} onChange={e => setUser(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm mb-1">Password</label>
          <input className="w-full border rounded px-3 py-2" type="password" value={pass} onChange={e => setPass(e.target.value)} />
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button className="bg-black text-white px-4 py-2 rounded" disabled={busy} type="submit">Login</button>
      </form>
    </div>
  );
}


