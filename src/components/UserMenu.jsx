'use client';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import styles from './UserMenu.module.css';

export default function UserMenu() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <div className={styles.placeholder} />;
  }

  if (!session) {
    return (
      <div className={styles.authLinks}>
        <Link href="/login" className={styles.loginBtn} aria-label="Iniciar sesión">
          <svg
            className={styles.avatarIcon}
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle cx="12" cy="8" r="4" />
            <path d="M4.5 21a7.5 7.5 0 0 1 15 0" />
          </svg>
        </Link>
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
