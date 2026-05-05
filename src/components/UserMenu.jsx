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
        <Link href="/login" className={styles.loginBtn} aria-label="Iniciar sesi?n">
          <span className={styles.avatarIcon} aria-hidden="true" />
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
