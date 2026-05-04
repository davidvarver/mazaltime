'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ImageUpload from '@/components/ImageUpload';
import styles from './AdminClient.module.css';

export default function AdminClient({ raffle: initialRaffle, tickets: initialTickets, admins }) {
  const router = useRouter();
  const [currentAdminId, setCurrentAdminId] = useState('');
  const [tickets, setTickets] = useState(initialTickets);
  const [raffle] = useState(initialRaffle);

  // Edit raffle form
  const [editRaffleData, setEditRaffleData] = useState(initialRaffle || {
    title: '', watchName: '', zodiacSign: '', drawDate: '', price1: 4200, price2: 4000, imageUrl: ''
  });

  // End raffle
  const [winningNumber, setWinningNumber] = useState('');

  // Bulk sale modal
  const [saleModal, setSaleModal] = useState(false);
  const [saleNumbers, setSaleNumbers] = useState('');
  const [saleForm, setSaleForm] = useState({ name: '', phone: '' });

  // Create raffle
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newRaffleData, setNewRaffleData] = useState({
    title: 'MAZAL TIME', watchName: '', zodiacSign: '', drawDate: '', price1: 4200, price2: 4000, imageUrl: ''
  });

  // --- Handlers ---

  const handleLiberate = async (number) => {
    if (!currentAdminId) { alert('Selecciona tu cuenta primero.'); return; }
    try {
      const res = await fetch('/api/admin/ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ numbers: [number], status: 'AVAILABLE', adminId: currentAdminId, raffleId: raffle.id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTickets(prev => prev.map(t => {
        const updated = data.tickets.find(u => u.number === t.number);
        return updated || t;
      }));
    } catch (err) { alert(err.message); }
  };

  const handleOpenSale = () => {
    if (!currentAdminId) { alert('Selecciona tu cuenta primero.'); return; }
    setSaleNumbers('');
    setSaleForm({ name: '', phone: '' });
    setSaleModal(true);
  };

  const handleSaleSubmit = async (e) => {
    e.preventDefault();
    const numberList = saleNumbers
      .split(/[\s,]+/)
      .map(n => parseInt(n.trim(), 10))
      .filter(n => !isNaN(n) && n >= 0 && n <= 99);

    if (numberList.length === 0) { alert('Ingresa al menos un número válido (0-99).'); return; }

    const unavailable = tickets.filter(t => numberList.includes(t.number) && t.status !== 'AVAILABLE');
    if (unavailable.length > 0) {
      alert(`Los números ${unavailable.map(t => t.number.toString().padStart(2, '0')).join(', ')} ya están ocupados.`);
      return;
    }

    try {
      const res = await fetch('/api/admin/ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          numbers: numberList,
          status: 'SOLD',
          adminId: currentAdminId,
          raffleId: raffle.id,
          buyerName: saleForm.name,
          buyerPhone: saleForm.phone
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTickets(prev => prev.map(t => {
        const updated = data.tickets.find(u => u.number === t.number);
        return updated || t;
      }));
      setSaleModal(false);
    } catch (err) { alert(err.message); }
  };

  const handleUpdateRaffle = async (e) => {
    e.preventDefault();
    if (!raffle) return;
    try {
      const res = await fetch('/api/admin/raffle', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: raffle.id, ...editRaffleData })
      });
      if (!res.ok) throw new Error('Error al actualizar');
      alert('Rifa actualizada correctamente');
      router.refresh();
    } catch (err) { alert(err.message); }
  };

  const handleEndRaffle = async (e) => {
    e.preventDefault();
    if (!raffle) return;
    if (!winningNumber) return alert('Ingresa el número ganador');
    const confirmed = confirm(`¿El número ganador es el ${winningNumber}? Esto finalizará la rifa.`);
    if (!confirmed) return;
    try {
      const res = await fetch('/api/admin/raffle', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: raffle.id, isActive: false, winningNumber })
      });
      if (!res.ok) throw new Error('Error al finalizar');
      alert('Rifa finalizada. Se movió a Rifas Pasadas.');
      window.location.reload();
    } catch (err) { alert(err.message); }
  };

  const handleCreateRaffle = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/raffle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRaffleData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      alert('Nueva rifa creada con 100 boletos disponibles.');
      window.location.reload();
    } catch (err) { alert(err.message); }
  };

  // --- Derived values ---
  const parsedSaleNumbers = saleNumbers
    .split(/[\s,]+/)
    .map(n => parseInt(n.trim(), 10))
    .filter(n => !isNaN(n) && n >= 0 && n <= 99);
  const salePrice = raffle
    ? (parsedSaleNumbers.length >= 2 ? raffle.price2 : raffle.price1)
    : 0;
  const saleTotal = parsedSaleNumbers.length * salePrice;

  const adminRevenue = admins.map(admin => {
    const adminTickets = tickets.filter(t => t.adminId === admin.id && t.status === 'SOLD');
    const revenue = adminTickets.reduce((sum, t) => sum + (t.pricePaid || (raffle?.price1 || 0)), 0);
    return { ...admin, count: adminTickets.length, revenue };
  });

  const totalReal = tickets
    .filter(t => t.status === 'SOLD')
    .reduce((sum, t) => sum + (t.pricePaid || (raffle?.price1 || 0)), 0);

  // --- Render ---
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Panel de Control Mazal Time</h1>
        <div className={styles.adminSelector}>
          <label>Iniciaste como:</label>
          <select
            value={currentAdminId}
            onChange={e => setCurrentAdminId(e.target.value)}
            className={styles.select}
          >
            <option value="">-- Seleccionar Socio --</option>
            {admins.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>
      </header>

      {raffle ? (
        <>
          <div className={styles.gridContainer}>
            {/* Stats generales */}
            <div className={styles.statsCard}>
              <h3>Rifa Actual</h3>
              <p>Disponibles: <strong>{tickets.filter(t => t.status === 'AVAILABLE').length}</strong></p>
              <p>Vendidos: <strong>{tickets.filter(t => t.status === 'SOLD').length}</strong></p>
              <p>Total recaudado real: <strong>${totalReal.toLocaleString()} MXN</strong></p>
            </div>

            {/* Revenue por socio */}
            <div className={styles.statsCard}>
              <h3>Recaudado por Socio</h3>
              {adminRevenue.map(a => (
                <div key={a.id} className={styles.adminRevenueRow}>
                  <span className={styles.adminName}>{a.name}</span>
                  <span className={styles.adminBoletos}>{a.count} boleto{a.count !== 1 ? 's' : ''}</span>
                  <span className={styles.adminMoney}>${a.revenue.toLocaleString()} MXN</span>
                </div>
              ))}
              <div className={styles.adminRevenueTotal}>
                <span>Total</span>
                <span>${adminRevenue.reduce((s, a) => s + a.revenue, 0).toLocaleString()} MXN</span>
              </div>
            </div>

            {/* Editar rifa */}
            <div className={styles.statsCard}>
              <h3>Editar Información de Rifa</h3>
              <form onSubmit={handleUpdateRaffle} className={styles.editForm}>
                <input type="text" placeholder="Título" value={editRaffleData.title} onChange={e => setEditRaffleData({...editRaffleData, title: e.target.value})} />
                <input type="text" placeholder="Nombre del Reloj" value={editRaffleData.watchName} onChange={e => setEditRaffleData({...editRaffleData, watchName: e.target.value})} />
                <input type="text" placeholder="Signo" value={editRaffleData.zodiacSign} onChange={e => setEditRaffleData({...editRaffleData, zodiacSign: e.target.value})} />
                <input type="date" value={editRaffleData.drawDate ? new Date(editRaffleData.drawDate).toISOString().split('T')[0] : ''} onChange={e => setEditRaffleData({...editRaffleData, drawDate: e.target.value})} />
                <input type="number" placeholder="Precio 1 boleto" value={editRaffleData.price1} onChange={e => setEditRaffleData({...editRaffleData, price1: parseInt(e.target.value)})} />
                <input type="number" placeholder="Precio 2+ boletos" value={editRaffleData.price2} onChange={e => setEditRaffleData({...editRaffleData, price2: parseInt(e.target.value)})} />
                <ImageUpload currentUrl={editRaffleData.imageUrl} onUploaded={url => setEditRaffleData({...editRaffleData, imageUrl: url})} />
                <button type="submit" className={styles.saveBtn}>Guardar Cambios</button>
              </form>
            </div>

            {/* Finalizar rifa */}
            <div className={styles.statsCard}>
              <h3>Finalizar Rifa Actual</h3>
              <p style={{fontSize:'0.85rem', color:'#ffb74d', marginBottom:'1rem'}}>
                Esto archivará la rifa y la mostrará en &quot;Rifas Pasadas&quot;.
              </p>
              <form onSubmit={handleEndRaffle} className={styles.editForm}>
                <input type="number" min="0" max="99" placeholder="Número Ganador (0-99)" value={winningNumber} onChange={e => setWinningNumber(e.target.value)} required />
                <button type="submit" className={styles.endBtn}>Archivar Rifa (Finalizar)</button>
              </form>
            </div>
          </div>

          {/* Botón Venta Manual */}
          <div className={styles.saleBar}>
            <button className={styles.saleBtn} onClick={handleOpenSale} disabled={!currentAdminId}>
              💵 Registrar Venta Manual (Efectivo / Transferencia)
            </button>
            {!currentAdminId && <span className={styles.saleHint}>Selecciona tu socio primero</span>}
          </div>

          {/* Tabla de boletos */}
          <div className={styles.tableCard}>
            <h3>Gestión de Boletos</h3>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Estado</th>
                    <th>Cliente</th>
                    <th>Teléfono</th>
                    <th>Precio</th>
                    <th>Socio</th>
                    <th>Liberar</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map(ticket => (
                    <tr key={ticket.id}>
                      <td className={styles.numberCell}>{ticket.number.toString().padStart(2, '0')}</td>
                      <td>
                        <span className={`${styles.statusBadge} ${styles[ticket.status.toLowerCase()]}`}>
                          {ticket.status === 'SOLD' ? 'Vendido' : 'Disponible'}
                        </span>
                      </td>
                      <td>{ticket.user?.name || ticket.buyerName || '-'}</td>
                      <td>{ticket.user?.phone || ticket.buyerPhone || '-'}</td>
                      <td>{ticket.pricePaid ? `$${ticket.pricePaid.toLocaleString()}` : (ticket.status === 'SOLD' ? `$${raffle.price1.toLocaleString()}` : '-')}</td>
                      <td>{ticket.admin?.name || '-'}</td>
                      <td>
                        {ticket.status === 'SOLD' && (
                          <button className={styles.liberateBtn} onClick={() => handleLiberate(ticket.number)} disabled={!currentAdminId}>
                            Liberar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bulk Sale Modal */}
          {saleModal && (
            <div className={styles.modalOverlay}>
              <div className={`${styles.modalBox} glass`}>
                <h3>💵 Registrar Venta Manual</h3>
                <p className={styles.modalSub}>
                  Escribe los números separados por comas o espacios.<br />
                  El precio se calcula automáticamente.
                </p>
                <form onSubmit={handleSaleSubmit} className={styles.editForm}>
                  <input
                    type="text" required
                    placeholder="Números (ej: 05, 23, 41)"
                    value={saleNumbers}
                    onChange={e => setSaleNumbers(e.target.value)}
                  />
                  {parsedSaleNumbers.length > 0 && (
                    <div className={styles.saleSummary}>
                      <span>🎫 {parsedSaleNumbers.length} número{parsedSaleNumbers.length > 1 ? 's' : ''}</span>
                      <span>{parsedSaleNumbers.length >= 2 ? `Precio grupal: $${raffle.price2.toLocaleString()} c/u` : `Precio individual: $${raffle.price1.toLocaleString()}`}</span>
                      <strong className={styles.saleTotal}>Total: ${saleTotal.toLocaleString()} MXN</strong>
                    </div>
                  )}
                  <input type="text" required placeholder="Nombre completo del comprador" value={saleForm.name} onChange={e => setSaleForm({...saleForm, name: e.target.value})} />
                  <input type="tel" required placeholder="Teléfono / WhatsApp" value={saleForm.phone} onChange={e => setSaleForm({...saleForm, phone: e.target.value})} />
                  <div className={styles.modalActions}>
                    <button type="button" onClick={() => setSaleModal(false)} className={styles.endBtn}>Cancelar</button>
                    <button type="submit" className={styles.saveBtn}>Confirmar Venta</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Create New Raffle */}
          <div className={styles.createSection}>
            <button className={styles.createToggleBtn} onClick={() => setShowCreateForm(!showCreateForm)}>
              {showCreateForm ? '✕ Cancelar' : '+ Crear Nueva Rifa'}
            </button>
            {showCreateForm && (
              <div className={`${styles.statsCard} ${styles.createFormCard}`}>
                <h3>Nueva Rifa</h3>
                <p style={{fontSize:'0.85rem', color:'var(--color-text-muted)', marginBottom:'1rem'}}>
                  Solo puede haber una rifa activa a la vez.
                </p>
                <form onSubmit={handleCreateRaffle} className={styles.editForm}>
                  <input type="text" required placeholder="Título (ej: MAZAL TIME)" value={newRaffleData.title} onChange={e => setNewRaffleData({...newRaffleData, title: e.target.value})} />
                  <input type="text" required placeholder="Nombre del Reloj" value={newRaffleData.watchName} onChange={e => setNewRaffleData({...newRaffleData, watchName: e.target.value})} />
                  <input type="text" required placeholder="Signo Zodiacal" value={newRaffleData.zodiacSign} onChange={e => setNewRaffleData({...newRaffleData, zodiacSign: e.target.value})} />
                  <input type="date" required value={newRaffleData.drawDate} onChange={e => setNewRaffleData({...newRaffleData, drawDate: e.target.value})} />
                  <input type="number" required placeholder="Precio 1 Boleto (MXN)" value={newRaffleData.price1} onChange={e => setNewRaffleData({...newRaffleData, price1: parseInt(e.target.value)})} />
                  <input type="number" required placeholder="Precio 2+ Boletos (MXN)" value={newRaffleData.price2} onChange={e => setNewRaffleData({...newRaffleData, price2: parseInt(e.target.value)})} />
                  <ImageUpload currentUrl={newRaffleData.imageUrl} onUploaded={url => setNewRaffleData({...newRaffleData, imageUrl: url})} />
                  <button type="submit" className={styles.saveBtn}>Crear Rifa y Activar</button>
                </form>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className={styles.createRaffleContainer}>
          <div className={styles.statsCard}>
            <h2>No hay una rifa activa</h2>
            <p style={{marginBottom:'1rem', color:'var(--color-text-muted)'}}>Llena los datos para lanzar la siguiente rifa.</p>
            <form onSubmit={handleCreateRaffle} className={styles.editForm}>
              <input type="text" required placeholder="Título" value={newRaffleData.title} onChange={e => setNewRaffleData({...newRaffleData, title: e.target.value})} />
              <input type="text" required placeholder="Nombre del Reloj" value={newRaffleData.watchName} onChange={e => setNewRaffleData({...newRaffleData, watchName: e.target.value})} />
              <input type="text" required placeholder="Signo Zodiacal" value={newRaffleData.zodiacSign} onChange={e => setNewRaffleData({...newRaffleData, zodiacSign: e.target.value})} />
              <input type="date" required value={newRaffleData.drawDate} onChange={e => setNewRaffleData({...newRaffleData, drawDate: e.target.value})} />
              <input type="number" required placeholder="Precio 1 Boleto" value={newRaffleData.price1} onChange={e => setNewRaffleData({...newRaffleData, price1: parseInt(e.target.value)})} />
              <input type="number" required placeholder="Precio 2+ Boletos" value={newRaffleData.price2} onChange={e => setNewRaffleData({...newRaffleData, price2: parseInt(e.target.value)})} />
              <ImageUpload currentUrl={newRaffleData.imageUrl} onUploaded={url => setNewRaffleData({...newRaffleData, imageUrl: url})} />
              <button type="submit" className={styles.saveBtn} style={{marginTop:'1rem'}}>Crear Rifa y Activar</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
