'use client';
import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import styles from './UserMenu.module.css';

export default function UserMenu() {
  const { data: session, status } = useSession();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Render nothing on the server pass to avoid hydration mismatch
  if (!mounted || status === 'loading') {
    return <div className={styles.placeholder} />;
  }

  if (!session) {
    return (
      <div className={styles.authLinks}>
        <Link href="/login" className={styles.loginBtn}>Iniciar Sesión</Link>
      </div>
    );
  }

  return (
    <div className={styles.menu}>
      <span className={styles.welcome}>Hola, {session.user.name?.split(' ')[0]}</span>
      <Link href="/mis-boletos" className={styles.navLink}>Mis Boletos</Link>
      <button onClick={() => signOut()} className={styles.logoutBtn}>Salir</button>
    </div>
  );
}
