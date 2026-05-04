'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../../registro/registro.module.css';

export default function AdminLoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo iniciar sesión');

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
      <div className={`${styles.card} glass`}>
        <h2>Acceso Socios</h2>
        {error && <div className={styles.error}>{error}</div>}
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label>Usuario</label>
            <input
              type="text"
              required
              value={formData.username}
              onChange={e => setFormData({ ...formData, username: e.target.value })}
              autoComplete="username"
            />
          </div>
          <div className={styles.formGroup}>
            <label>Contraseña</label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
              autoComplete="current-password"
            />
          </div>
          <button type="submit" disabled={loading} className={styles.submitBtn}>
            {loading ? 'Entrando...' : 'Entrar al panel'}
          </button>
        </form>
      </div>
    </div>
  );
}
