'use client';
import { useSearchParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import styles from '../registro/registro.module.css';

export default function RestablecerContrasenaPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/password-reset/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo cambiar la contraseña.');
      setMessage('Contraseña actualizada. Ya puedes iniciar sesión.');
      setTimeout(() => router.push('/login'), 1200);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.brandMark}>Mazal Time</div>
        <span className={styles.eyebrow}>Nuevo acceso</span>
        <h2>Cambiar contrase&ntilde;a</h2>
        {!token && <div className={styles.error}>Enlace inválido.</div>}
        {error && <div className={styles.error}>{error}</div>}
        {message && <div className={styles.success}>{message}</div>}
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label>Nueva contrase&ntilde;a</label>
            <input type="password" required minLength={8} value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <div className={styles.formGroup}>
            <label>Confirmar contrase&ntilde;a</label>
            <input type="password" required minLength={8} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
          </div>
          <button type="submit" disabled={loading || !token} className={styles.submitBtn}>
            {loading ? 'Guardando...' : 'Guardar contraseña'}
          </button>
        </form>
        <p className={styles.footerText}>
          <Link href="/login" className={styles.link}>Volver a iniciar sesi&oacute;n</Link>
        </p>
      </div>
    </div>
  );
}
