'use client';
import { useState } from 'react';
import Link from 'next/link';
import styles from '../registro/registro.module.css';

export default function RecuperarContrasenaPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/password-reset/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo enviar el correo.');
      setMessage('Si el correo existe, te mandamos un enlace para cambiar tu contraseña.');
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
        <span className={styles.eyebrow}>Recuperar acceso</span>
        <h2>Recuperar contrase&ntilde;a</h2>
        {error && <div className={styles.error}>{error}</div>}
        {message && <div className={styles.success}>{message}</div>}
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label>Correo electr&oacute;nico</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@correo.com" />
          </div>
          <button type="submit" disabled={loading} className={styles.submitBtn}>
            {loading ? 'Enviando...' : 'Mandar enlace'}
          </button>
        </form>
        <p className={styles.footerText}>
          <Link href="/login" className={styles.link}>Volver a iniciar sesi&oacute;n</Link>
        </p>
      </div>
    </div>
  );
}
