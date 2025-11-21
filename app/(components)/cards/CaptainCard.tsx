"use client";
import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

type Locale = 'ar' | 'en' | 'tr';

type CardLocaleData = {
  name: string;
  rank: string;
  fleet: string;
  employer: string;
  about: string;
  safety: string[];
  certs: string[];
  aircraftHours: {
    types: string[];
    total: string;
    currentType: string;
    ifr: string;
    vfr: string;
  };
  timeline: { year: string; desc: string }[];
  contacts: { email: string; whatsapp?: string; linkedin?: string; website?: string };
  disclaimer: string;
  base: string;
  languages: string[];
  photoUrl?: string;
};

type CardData = Record<Locale, CardLocaleData>;

export function CaptainCard({ locale, handle }: { locale: Locale; handle: string }) {
  const [data, setData] = useState<CardData | null>(null);
  const search = useSearchParams();
  const router = useRouter();
  const editFlag = search.get('edit') === '1';
  const [user, setUser] = useState<string | null>(null);
  const [pass, setPass] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const load = async () => {
      const res = await fetch(`/api/cards/${handle}`, { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        setData(json as CardData);
      }
    };
    load();
  }, [handle]);

  const L = useMemo(() => (data ? (data[locale] as CardLocaleData) : null), [data, locale]);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const u = window.sessionStorage.getItem('cardUser');
      const p = window.sessionStorage.getItem('cardPass');
      setUser(u);
      setPass(p);
    }
  }, []);
  const canEdit = editFlag && user === 'moh' && pass === 'Aa@05524409044.com';

  const save = async () => {
    if (!data) return;
    setBusy(true);
    try {
      await fetch(`/api/cards/${handle}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user': user || '',
          'x-pass': pass || '',
        },
        body: JSON.stringify(data),
      });
    } finally {
      setBusy(false);
    }
  };

  if (!data || !L) {
    return <div className="container mx-auto px-4 py-12">Loading…</div>;
  }

  const setLocaleData = (updater: (draft: CardLocaleData) => void) => {
    setData(prev => {
      if (!prev) return prev;
      const next = { ...prev } as CardData;
      const copy = { ...next[locale] } as CardLocaleData;
      updater(copy);
      next[locale] = copy as any;
      return next;
    });
  };

  const isRtl = locale === 'ar';

  return (
    <div className={`min-h-screen ${isRtl ? 'rtl' : ''}`} dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900"></div>
        <div className="relative container mx-auto px-4 pt-10 pb-14">
          <div className="flex items-center justify-between mb-8">
            <Link href={`/${locale}`} className="flex items-center gap-2 text-white">
              <Image src="/icons/logo.png" alt="VETAP" width={28} height={28} />
              <span className="font-semibold">VETAP</span>
            </Link>
            {canEdit && (
              <div className="flex items-center gap-2">
                <button className="px-4 py-2 rounded border border-white/30 text-white hover:bg-white/10 transition" onClick={() => router.replace(`/${locale}/cards/${handle}/page`)}>Exit Edit</button>
                <button className="px-4 py-2 rounded bg-white text-slate-900 hover:bg-slate-100 transition" onClick={save} disabled={busy}>Save</button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[120px_1fr] gap-6 items-center">
            <div className="shrink-0">
              {L.photoUrl && (
                <Image src={L.photoUrl} alt={L.name} width={120} height={120} className="rounded-full object-cover ring-2 ring-white/20 shadow-lg" />
              )}
            </div>
            <div className="text-white">
              {canEdit ? (
                <input className="bg-transparent text-3xl md:text-4xl font-bold w-full border-b border-white/20 focus:border-white/60 outline-none" value={L.name} onChange={e => setLocaleData(d => (d.name = e.target.value))} />
              ) : (
                <h1 className="text-3xl md:text-4xl font-bold">{L.name}</h1>
              )}
              <p className="mt-1 text-white/80">{L.rank} — {L.fleet}</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link href={`/${locale}/cards/${handle}/vcard`} className="px-4 py-2 rounded bg-white text-slate-900 hover:bg-slate-100 transition">Save Contact (vCard)</Link>
                <Link href={`/${locale}/contact?utm_source=card&utm_medium=cta`} className="px-4 py-2 rounded border border-white/30 text-white hover:bg-white/10 transition">Request similar page</Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-10 pb-16">
        {/* Employer Card */}
        <div className="mb-6">
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-4 flex items-center gap-3 text-sm text-slate-700">
            <span className="inline-block w-2 h-2 rounded-full bg-slate-300" />
            <span className="opacity-80">{L.employer}</span>
          </div>
        </div>

        {/* About */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 rounded-xl border border-slate-200 bg-white shadow-sm p-6 hover:shadow-md transition">
            <h2 className="font-semibold mb-3 text-slate-900">About the Captain</h2>
            {canEdit ? (
              <textarea className="w-full border rounded p-3 border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-300" rows={4} value={L.about} onChange={e => setLocaleData(d => (d.about = e.target.value))} />
            ) : (
              <p className="text-slate-700 leading-relaxed">{L.about}</p>
            )}
          </div>
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6 hover:shadow-md transition">
            <h2 className="font-semibold mb-3 text-slate-900">Base & Languages</h2>
            <p className="text-slate-700 mb-2"><span className="font-medium">Base:</span> {L.base}</p>
            <div className="flex flex-wrap gap-2">
              {L.languages.map((lang, i) => (
                <span key={i} className="px-2 py-1 text-xs rounded-full bg-slate-100 text-slate-700 border border-slate-200">{lang}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Safety & Certificates */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6 hover:shadow-md transition">
            <h2 className="font-semibold mb-3 text-slate-900">Safety & Operational Discipline</h2>
            <ul className="space-y-2">
              {L.safety.map((s, i) => (
                <li key={i} className="flex items-center gap-2 text-slate-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                  {canEdit ? (
                    <input className="border rounded px-2 py-1 border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-300" value={s} onChange={e => setLocaleData(d => (d.safety[i] = e.target.value))} />
                  ) : (
                    <span>{s}</span>
                  )}
                </li>
              ))}
            </ul>
            {canEdit && (
              <button className="mt-3 text-sm text-slate-600 hover:text-slate-900" onClick={() => setLocaleData(d => d.safety.push(''))}>+ Add</button>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6 hover:shadow-md transition">
            <h2 className="font-semibold mb-3 text-slate-900">Certificates & Licenses</h2>
            <ul className="space-y-2">
              {L.certs.map((s, i) => (
                <li key={i} className="flex items-center gap-2 text-slate-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                  {canEdit ? (
                    <input className="border rounded px-2 py-1 border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-300" value={s} onChange={e => setLocaleData(d => (d.certs[i] = e.target.value))} />
                  ) : (
                    <span>{s}</span>
                  )}
                </li>
              ))}
            </ul>
            {canEdit && (
              <button className="mt-3 text-sm text-slate-600 hover:text-slate-900" onClick={() => setLocaleData(d => d.certs.push(''))}>+ Add</button>
            )}
          </div>
        </div>

        {/* Types & Hours */}
        <div className="mt-6 rounded-xl border border-slate-200 bg-white shadow-sm p-6 hover:shadow-md transition">
          <h2 className="font-semibold mb-4 text-slate-900">Aircraft Types & Flight Hours</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-slate-800">
            <div>
              <h3 className="font-medium mb-2">Types</h3>
              <div className="flex flex-wrap gap-2">
                {L.aircraftHours.types.map((t, i) => (
                  <div key={i} className="px-2 py-1 text-xs rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    {canEdit ? (
                      <input className="bg-transparent outline-none w-28" value={t} onChange={e => setLocaleData(d => (d.aircraftHours.types[i] = e.target.value))} />
                    ) : (
                      t
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-medium mb-2">Hours</h3>
              <div className="grid grid-cols-2 gap-3">
                {(['total','currentType','ifr','vfr'] as const).map((k) => (
                  <div key={k} className="flex items-center gap-2">
                    <span className="w-28 capitalize text-slate-600">{k}</span>
                    {canEdit ? (
                      <input className="border rounded px-2 py-1 w-full border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-300" value={(L.aircraftHours as any)[k]} onChange={e => setLocaleData(d => ((d.aircraftHours as any)[k] = e.target.value))} />
                    ) : (
                      <span>{(L.aircraftHours as any)[k]}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="mt-6 rounded-xl border border-slate-200 bg-white shadow-sm p-6 hover:shadow-md transition">
          <h2 className="font-semibold mb-4 text-slate-900">Professional Record</h2>
          <div className="relative">
            <div className="absolute left-3 top-0 bottom-0 w-px bg-slate-200" />
            <ul className="space-y-4 relative">
              {L.timeline.map((e, i) => (
                <li key={i} className="pl-8">
                  <div className="w-2 h-2 bg-slate-400 rounded-full absolute left-2.5 mt-2" />
                  <div className="flex items-center gap-3 text-slate-800">
                    {canEdit ? (
                      <>
                        <input className="border rounded px-2 py-1 w-24 border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-300" value={e.year} onChange={ev => setLocaleData(d => (d.timeline[i].year = ev.target.value))} />
                        <input className="border rounded px-2 py-1 flex-1 border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-300" value={e.desc} onChange={ev => setLocaleData(d => (d.timeline[i].desc = ev.target.value))} />
                      </>
                    ) : (
                      <>
                        <span className="w-24 text-slate-500">{e.year}</span>
                        <span className="flex-1">{e.desc}</span>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
          {canEdit && (
            <button className="mt-3 text-sm text-slate-600 hover:text-slate-900" onClick={() => setLocaleData(d => d.timeline.push({ year: '', desc: '' }))}>+ Add</button>
          )}
        </div>

        {/* Contact */}
        <div className="mt-6 rounded-xl border border-slate-200 bg-white shadow-sm p-6 hover:shadow-md transition">
          <h2 className="font-semibold mb-3 text-slate-900">Professional Contact</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-800">
            {(['email','whatsapp','linkedin','website'] as const).map((k) => (
              <div key={k} className="flex items-center gap-2">
                <span className="w-28 capitalize text-slate-600">{k}</span>
                {canEdit ? (
                  <input className="border rounded px-2 py-1 w-full border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-300" value={(L.contacts as any)[k] || ''} onChange={e => setLocaleData(d => ((d.contacts as any)[k] = e.target.value))} />
                ) : (
                  <span>{(L.contacts as any)[k]}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Legal */}
        <div className="mt-8 text-xs text-slate-500 border-t pt-6">
          {canEdit ? (
            <textarea className="w-full border rounded p-2 border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-300" rows={2} value={L.disclaimer} onChange={e => setLocaleData(d => (d.disclaimer = e.target.value))} />
          ) : (
            <p>{L.disclaimer}</p>
          )}
          <p className="mt-2 opacity-70">Logo placement: Employer logo allowed inside Employer card only, small, gray, no official affiliation implied.</p>
        </div>
      </div>
    </div>
  );
}


