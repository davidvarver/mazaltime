'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../../registro/registro.module.css';

export default function ChangeAdminPasswordPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.newPassword !== formData.confirmPassword) {
      setError('La nueva contrasena no coincide.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/admin/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo cambiar la contrasena');

      router.push('/panel-socios');
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
        <span className={styles.eyebrow}>Primer acceso</span>
        <h2>Cambia tu contrasena</h2>
        {error && <div className={styles.error}>{error}</div>}
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label>Contrasena actual</label>
            <input
              type="password"
              required
              value={formData.currentPassword}
              onChange={e => setFormData({ ...formData, currentPassword: e.target.value })}
              autoComplete="current-password"
            />
          </div>
          <div className={styles.formGroup}>
            <label>Nueva contrasena</label>
            <input
              type="password"
              required
              minLength={8}
              value={formData.newPassword}
              onChange={e => setFormData({ ...formData, newPassword: e.target.value })}
              autoComplete="new-password"
            />
          </div>
          <div className={styles.formGroup}>
            <label>Confirmar nueva contrasena</label>
            <input
              type="password"
              required
              minLength={8}
              value={formData.confirmPassword}
              onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
              autoComplete="new-password"
            />
          </div>
          <button type="submit" disabled={loading} className={styles.submitBtn}>
            {loading ? 'Guardando...' : 'Guardar y entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
