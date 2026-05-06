'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import styles from './registro.module.css';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ name: '', email: '', password: '', phone: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al registrar');
      }

      const signInRes = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (signInRes?.error) {
        throw new Error('Error al iniciar sesi&oacute;n autom&aacute;ticamente');
      }

      router.push('/');
      router.refresh();
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
        <span className={styles.eyebrow}>Nueva cuenta</span>
        <h2>Crear cuenta</h2>
        {error && <div className={styles.error}>{error}</div>}
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label>Nombre completo</label>
            <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
          </div>
          <div className={styles.formGroup}>
            <label>Correo electr&oacute;nico</label>
            <input type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
          </div>
          <div className={styles.formGroup}>
            <label>Tel&eacute;fono (opcional)</label>
            <input type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
          </div>
          <div className={styles.formGroup}>
            <label>Contrase&ntilde;a</label>
            <input type="password" required value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
          </div>
          <button type="submit" disabled={loading} className={styles.submitBtn}>
            {loading ? 'Registrando...' : 'Registrarse'}
          </button>
        </form>
        <p className={styles.footerText}>
          &iquest;Ya tienes cuenta? <Link href="/login" className={styles.link}>Inicia sesi&oacute;n</Link>
        </p>
      </div>
    </div>
  );
}
