'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import styles from '../registro/registro.module.css';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (res?.error) {
        throw new Error(res.error);
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
        <span className={styles.eyebrow}>Acceso cliente</span>
        <h2>Iniciar sesi&oacute;n</h2>
        {error && <div className={styles.error}>{error}</div>}
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label>Correo electr&oacute;nico</label>
            <input type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
          </div>
          <div className={styles.formGroup}>
            <label>Contrase&ntilde;a</label>
            <input type="password" required value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
          </div>
          <Link href="/recuperar-contrasena" className={styles.link}>Olvid&eacute; mi contrase&ntilde;a</Link>
          <button type="submit" disabled={loading} className={styles.submitBtn}>
            {loading ? 'Iniciando...' : 'Entrar'}
          </button>
        </form>
        <p className={styles.footerText}>
          &iquest;No tienes cuenta? <Link href="/registro" className={styles.link}>Reg&iacute;strate</Link>
        </p>
      </div>
    </div>
  );
}
