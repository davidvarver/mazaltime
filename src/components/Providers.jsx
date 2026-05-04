'use client';
import dynamic from 'next/dynamic';

const SessionProvider = dynamic(
  () => import('next-auth/react').then(mod => mod.SessionProvider),
  { ssr: false }
);

export default function Providers({ children }) {
  return <SessionProvider>{children}</SessionProvider>;
}
