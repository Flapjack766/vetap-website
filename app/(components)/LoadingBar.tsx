'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export function LoadingBar() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const timeout = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timeout);
  }, [pathname]);

  if (!loading) return null;

  return (
    <div className="fixed left-0 top-0 z-[9999] h-0.5 w-full">
      <div className="h-full animate-pulse bg-gradient-to-r from-transparent via-foreground to-transparent" />
    </div>
  );
}

