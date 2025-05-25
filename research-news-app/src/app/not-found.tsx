'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function NotFound() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check if this is a dynamic route that should be handled client-side
    if (pathname.includes('/papers/') || pathname.includes('/newspapers/') || pathname.includes('/print/')) {
      // Do nothing - let the client-side router handle it
      return;
    }
    
    // For actual 404s, you might want to redirect or show a proper 404 page
  }, [pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-gray-500" />
        <p className="mt-2 text-sm text-gray-600">Loading...</p>
      </div>
    </div>
  );
}