'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import ImageUpload from '@/components/ImageUpload';
import { getDateOnlyValue } from '@/lib/dateOnly';
import styles from './AdminClient.module.css';

const MAX_GALLERY_IMAGES = 4;

export default function AdminClient({ raffle: initialRaffle, tickets: initialTickets, admins, pastRaffles = [], loggedAdminId = '', loggedAdminName = '', buyerInsights = [] }) {
  const router = useRouter();
  const currentAdminId = loggedAdminId;
  const [tickets, setTickets] = useState(initialTickets);
  const [raffle] = useState(initialRaffle);
  const [pastRaffleForms, setPastRaffleForms] = useState(() =>
    pastRaffles.map(pastRaffle => ({
      ...pastRaffle,
      drawDate: getDateOnlyValue(pastRaffle.drawDate),
      winningNumber: pastRaffle.winningNumber ?? '',
    }))
  );
  const [editingPastRaffleId, setEditingPastRaffleId] = useState(null);

  // Edit raffle form
  const [editRaffleData, setEditRaffleData] = useState(initialRaffle || {
    title: '', watchName: '', watchDetails: '', zodiacSign: '', drawDate: '', price1: 4200, price2: 4000, imageUrl: '', galleryImages: [], lotteryUrl: ''
  });

  // End raffle
  const [winningNumber, setWinningNumber] = useState('');

  // Bulk sale modal
  const [saleModal, setSaleModal] = useState(false);
  const [saleNumbers, setSaleNumbers] = useState('');
  const [saleForm, setSaleForm] = useState({ name: '', phone: '', notes: '' });
  const [noteDrafts, setNoteDrafts] = useState(() =>
    Object.fromEntries(initialTickets.map(ticket => [ticket.id, ticket.notes || '']))
  );

  // Create raffle
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newRaffleData, setNewRaffleData] = useState({
    title: 'MAZAL TIME', watchName: '', watchDetails: '', zodiacSign: '', drawDate: '', price1: 4200, price2: 4000, imageUrl: '', galleryImages: [], lotteryUrl: ''
  });

  // --- Handlers ---
  const updateGalleryImage = (setFormState, index, url) => {
    setFormState(prev => {
      const galleryImages = [...(prev.galleryImages || [])];
      galleryImages[index] = url;

      return {
        ...prev,
        galleryImages: galleryImages.filter(Boolean).slice(0, MAX_GALLERY_IMAGES),
      };
    });
  };

  const removeGalleryImage = (setFormState, index) => {
    setFormState(prev => ({
      ...prev,
      galleryImages: (prev.galleryImages || []).filter((_, imageIndex) => imageIndex !== index),
    }));
  };

  const renderGalleryUploaders = (formData, setFormState) => {
    const galleryImages = formData.galleryImages || [];

    return (
      <div className={styles.galleryUploadSection}>
        <div className={styles.galleryUploadHeader}>
          <strong>Fotos extra del reloj</strong>
          <span>Opcional Â· mÃ¡ximo {MAX_GALLERY_IMAGES}</span>
        </div>
        <div className={styles.galleryUploadGrid}>
          {Array.from({ length: MAX_GALLERY_IMAGES }).map((_, index) => {
            const currentUrl = galleryImages[index] || '';

            return (
              <div key={`${index}-${currentUrl || 'empty'}`} className={styles.galleryUploadItem}>
                <ImageUpload
                  currentUrl={currentUrl}
                  onUploaded={url => updateGalleryImage(setFormState, index, url)}
                />
                {currentUrl && (
                  <button
                    type="button"
                    className={styles.removeGalleryBtn}
                    onClick={() => removeGalleryImage(setFormState, index)}
                  >
                    Quitar
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

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
      setNoteDrafts(prev => ({
        ...prev,
        ...Object.fromEntries(data.tickets.map(ticket => [ticket.id, ticket.notes || ''])),
      }));
    } catch (err) { alert(err.message); }
  };

  const handleOpenSale = () => {
    if (!currentAdminId) { alert('Selecciona tu cuenta primero.'); return; }
    setSaleNumbers('');
    setSaleForm({ name: '', phone: '', notes: '' });
    setSaleModal(true);
  };

  const handleSaleSubmit = async (e) => {
    e.preventDefault();
    const numberList = saleNumbers
      .split(/[\s,]+/)
      .map(n => parseInt(n.trim(), 10))
      .filter(n => !isNaN(n) && n >= 0 && n <= 99);

    if (numberList.length === 0) { alert('Ingresa al menos un nÃºmero vÃ¡lido (0-99).'); return; }

    const unavailable = tickets.filter(t => numberList.includes(t.number) && t.status !== 'AVAILABLE');
    if (unavailable.length > 0) {
      alert(`Los nÃºmeros ${unavailable.map(t => t.number.toString().padStart(2, '0')).join(', ')} ya estÃ¡n ocupados.`);
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
          buyerPhone: saleForm.phone,
          notes: saleForm.notes
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTickets(prev => prev.map(t => {
        const updated = data.tickets.find(u => u.number === t.number);
        return updated || t;
      }));
      setNoteDrafts(prev => ({
        ...prev,
        ...Object.fromEntries(data.tickets.map(ticket => [ticket.id, ticket.notes || ''])),
      }));
      setSaleModal(false);
    } catch (err) { alert(err.message); }
  };

  const handleSaveNote = async (ticketId) => {
    try {
      const res = await fetch('/api/admin/ticket', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId, notes: noteDrafts[ticketId] || '' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTickets(prev => prev.map(ticket => ticket.id === ticketId ? data.ticket : ticket));
      setNoteDrafts(prev => ({ ...prev, [ticketId]: data.ticket.notes || '' }));
    } catch (err) {
      alert(err.message);
    }
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
    if (!winningNumber) return alert('Ingresa el nÃºmero ganador');
    const confirmed = confirm(`Â¿El nÃºmero ganador es el ${winningNumber}? Esto finalizarÃ¡ la rifa.`);
    if (!confirmed) return;
    try {
      const res = await fetch('/api/admin/raffle', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: raffle.id, isActive: false, winningNumber })
      });
      if (!res.ok) throw new Error('Error al finalizar');
      alert('Rifa finalizada. Se moviÃ³ a Rifas Pasadas.');
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

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    window.location.href = '/panel-socios/login';
  };

  const updatePastRaffleForm = (id, updates) => {
    setPastRaffleForms(prev =>
      prev.map(pastRaffle => pastRaffle.id === id ? { ...pastRaffle, ...updates } : pastRaffle)
    );
  };

  const handleUpdatePastRaffle = async (e, pastRaffle) => {
    e.preventDefault();

    try {
      const res = await fetch('/api/admin/raffle', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: pastRaffle.id,
          title: pastRaffle.title,
          watchName: pastRaffle.watchName,
          watchDetails: pastRaffle.watchDetails,
          zodiacSign: pastRaffle.zodiacSign,
          drawDate: pastRaffle.drawDate,
          price1: pastRaffle.price1,
          price2: pastRaffle.price2,
          winningNumber: pastRaffle.winningNumber,
          imageUrl: pastRaffle.imageUrl,
          lotteryUrl: pastRaffle.lotteryUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al actualizar la rifa pasada');

      alert('Rifa pasada actualizada correctamente');
      setEditingPastRaffleId(null);
      router.refresh();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeletePastRaffle = async (pastRaffle) => {
    const confirmed = confirm(`Â¿Eliminar permanentemente "${pastRaffle.watchName}" y todos sus boletos?`);
    if (!confirmed) return;

    try {
      const res = await fetch('/api/admin/raffle', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: pastRaffle.id }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al eliminar la rifa pasada');

      setPastRaffleForms(prev => prev.filter(item => item.id !== pastRaffle.id));
      alert('Rifa pasada eliminada correctamente');
      router.refresh();
    } catch (err) {
      alert(err.message);
    }
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
  const buyersThisRaffle = buyerInsights.filter(buyer => buyer.boughtCurrent);
  const previousBuyersMissing = buyerInsights.filter(buyer => !buyer.boughtCurrent && buyer.totalTickets > 0);
  const newBuyers = buyerInsights.filter(buyer => buyer.customerStatus === 'NEW');
  const recurringBuyers = buyerInsights.filter(buyer => buyer.customerStatus === 'RECURRING');
  const inactiveBuyers = buyerInsights.filter(buyer => buyer.customerStatus === 'INACTIVE');

  // --- Render ---
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Panel de Control Mazal Time</h1>
        <div className={styles.headerActions}>
          <div className={styles.adminSelector}>
            <label>Iniciaste como:</label>
            <strong className={styles.lockedAdminName}>{loggedAdminName || 'Socio'}</strong>
          </div>
          <button type="button" className={styles.logoutBtn} onClick={handleLogout}>
            Cerrar sesi&oacute;n
          </button>
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
              <h3>Editar informaci&oacute;n de rifa</h3>
              <form onSubmit={handleUpdateRaffle} className={styles.editForm}>
                <input type="text" placeholder="T&iacute;tulo" value={editRaffleData.title} onChange={e => setEditRaffleData({...editRaffleData, title: e.target.value})} />
                <input type="text" placeholder="Nombre del Reloj" value={editRaffleData.watchName} onChange={e => setEditRaffleData({...editRaffleData, watchName: e.target.value})} />
                <input type="text" placeholder="Detalles del reloj (ej: Brand new 2025 full set)" value={editRaffleData.watchDetails || ''} onChange={e => setEditRaffleData({...editRaffleData, watchDetails: e.target.value})} />
                <input type="text" placeholder="Signo" value={editRaffleData.zodiacSign} onChange={e => setEditRaffleData({...editRaffleData, zodiacSign: e.target.value})} />
                <input type="date" value={getDateOnlyValue(editRaffleData.drawDate)} onChange={e => setEditRaffleData({...editRaffleData, drawDate: e.target.value})} />
                <input type="number" placeholder="Precio 1 boleto" value={editRaffleData.price1} onChange={e => setEditRaffleData({...editRaffleData, price1: parseInt(e.target.value)})} />
                <input type="number" placeholder="Precio 2+ boletos" value={editRaffleData.price2} onChange={e => setEditRaffleData({...editRaffleData, price2: parseInt(e.target.value)})} />
                <input type="url" placeholder="Link sorteo Loter&iacute;a Nacional" value={editRaffleData.lotteryUrl || ''} onChange={e => setEditRaffleData({...editRaffleData, lotteryUrl: e.target.value})} />
                <div className={styles.primaryImageUpload}>
                  <strong>Foto principal</strong>
                  <ImageUpload currentUrl={editRaffleData.imageUrl} onUploaded={url => setEditRaffleData({...editRaffleData, imageUrl: url})} />
                </div>
                {renderGalleryUploaders(editRaffleData, setEditRaffleData)}
                <button type="submit" className={styles.saveBtn}>Guardar Cambios</button>
              </form>
            </div>

            {/* Finalizar rifa */}
            <div className={styles.statsCard}>
              <h3>Finalizar Rifa Actual</h3>
              <p style={{fontSize:'0.85rem', color:'#ffb74d', marginBottom:'1rem'}}>
                Esto archivar&aacute; la rifa y la mostrar&aacute; en &quot;Rifas Pasadas&quot;.
              </p>
              <form onSubmit={handleEndRaffle} className={styles.editForm}>
                <input type="number" min="0" max="99" placeholder="N&uacute;mero ganador (0-99)" value={winningNumber} onChange={e => setWinningNumber(e.target.value)} required />
                <button type="submit" className={styles.endBtn}>Archivar Rifa (Finalizar)</button>
              </form>
            </div>
          </div>

          <div className={styles.tableCard}>
            <div className={styles.sectionHeaderRow}>
              <div className={styles.sectionHeader}>
                <h3>Base de compradores</h3>
                <p>Historial para identificar clientes recurrentes y compradores anteriores que no han comprado en esta rifa.</p>
              </div>
              <a href="/api/admin/buyers/export" className={styles.exportBtn}>
                Descargar Excel
              </a>
            </div>
            <div className={styles.buyerSummaryGrid}>
              <div className={styles.buyerMetric}>
                <span>Compradores hist&oacute;ricos</span>
                <strong>{buyerInsights.length}</strong>
              </div>
              <div className={styles.buyerMetric}>
                <span>Compraron esta rifa</span>
                <strong>{buyersThisRaffle.length}</strong>
              </div>
              <div className={styles.buyerMetric}>
                <span>Nuevos</span>
                <strong>{newBuyers.length}</strong>
              </div>
              <div className={styles.buyerMetric}>
                <span>Recurrentes</span>
                <strong>{recurringBuyers.length}</strong>
              </div>
              <div className={styles.buyerMetric}>
                <span>Inactivos esta vez</span>
                <strong>{inactiveBuyers.length || previousBuyersMissing.length}</strong>
              </div>
            </div>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Etiqueta</th>
                    <th>Contacto</th>
                    <th>Rifas</th>
                    <th>Boletos total</th>
                    <th>Gastado total</th>
                    <th>Esta rifa</th>
                  </tr>
                </thead>
                <tbody>
                  {buyerInsights.length === 0 ? (
                    <tr>
                      <td colSpan="7">Todav&iacute;a no hay compradores registrados.</td>
                    </tr>
                  ) : buyerInsights.map(buyer => (
                    <tr key={buyer.key}>
                      <td>{buyer.name}</td>
                      <td>
                        <span className={`${styles.customerTag} ${styles[`customer${buyer.customerStatus}`]}`}>
                          {buyer.customerStatusLabel}
                        </span>
                      </td>
                      <td>
                        <div>{buyer.phone || '-'}</div>
                        <small>{buyer.email || '-'}</small>
                      </td>
                      <td>{buyer.rafflesParticipated}</td>
                      <td>{buyer.totalTickets}</td>
                      <td>${buyer.totalSpent.toLocaleString()} MXN</td>
                      <td>
                        {buyer.boughtCurrent ? (
                          <span className={`${styles.badge} ${styles.sold}`}>
                            {buyer.currentTickets} boleto{buyer.currentTickets !== 1 ? 's' : ''}
                          </span>
                        ) : (
                          <span className={`${styles.badge} ${styles.available}`}>No ha comprado</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* BotÃ³n Venta Manual */}
          <div className={styles.saleBar}>
            <button className={styles.saleBtn} onClick={handleOpenSale} disabled={!currentAdminId}>
              Registrar venta manual (efectivo / transferencia)
            </button>
            {!currentAdminId && <span className={styles.saleHint}>Selecciona tu socio primero</span>}
          </div>

          {/* Tabla de boletos */}
          <div className={styles.tableCard}>
            <h3>Gesti&oacute;n de boletos</h3>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Estado</th>
                    <th>Cliente</th>
                    <th>Tel&eacute;fono</th>
                    <th>Precio</th>
                    <th>Socio</th>
                    <th>Notas</th>
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
                      <td className={styles.notesCell}>
                        {ticket.status === 'SOLD' ? (
                          <div className={styles.noteEditor}>
                            <textarea
                              value={noteDrafts[ticket.id] || ''}
                              placeholder="Ej: pendiente, pag&oacute; en efectivo, transferencia..."
                              onChange={e => setNoteDrafts(prev => ({ ...prev, [ticket.id]: e.target.value }))}
                              rows={2}
                            />
                            <button
                              type="button"
                              className={styles.noteSaveBtn}
                              onClick={() => handleSaveNote(ticket.id)}
                            >
                              Guardar nota
                            </button>
                          </div>
                        ) : '-'}
                      </td>
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
              <div className={styles.modalBox}>
                <h3>Registrar venta manual</h3>
                <p className={styles.modalSub}>
                  Escribe los n&uacute;meros separados por comas o espacios.<br />
                  El precio se calcula autom&aacute;ticamente.
                </p>
                <form onSubmit={handleSaleSubmit} className={styles.editForm}>
                  <input
                    type="text" required
                    placeholder="N&uacute;meros (ej: 05, 23, 41)"
                    value={saleNumbers}
                    onChange={e => setSaleNumbers(e.target.value)}
                  />
                  {parsedSaleNumbers.length > 0 && (
                    <div className={styles.saleSummary}>
                      <span>{parsedSaleNumbers.length} n&uacute;mero{parsedSaleNumbers.length > 1 ? 's' : ''}</span>
                      <span>{parsedSaleNumbers.length >= 2 ? `Precio grupal: $${raffle.price2.toLocaleString()} c/u` : `Precio individual: $${raffle.price1.toLocaleString()}`}</span>
                      <strong className={styles.saleTotal}>Total: ${saleTotal.toLocaleString()} MXN</strong>
                    </div>
                  )}
                  <input type="text" required placeholder="Nombre completo del comprador" value={saleForm.name} onChange={e => setSaleForm({...saleForm, name: e.target.value})} />
                  <input type="tel" required placeholder="Tel&eacute;fono / WhatsApp" value={saleForm.phone} onChange={e => setSaleForm({...saleForm, phone: e.target.value})} />
                  <textarea
                    placeholder="Anotaciones opcionales (pendiente, efectivo, transferencia, abono...)"
                    value={saleForm.notes}
                    onChange={e => setSaleForm({...saleForm, notes: e.target.value})}
                    rows={3}
                  />
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
              {showCreateForm ? 'Cancelar' : '+ Crear nueva rifa'}
            </button>
            {showCreateForm && (
              <div className={`${styles.statsCard} ${styles.createFormCard}`}>
                <h3>Nueva Rifa</h3>
                <p style={{fontSize:'0.85rem', color:'var(--color-text-muted)', marginBottom:'1rem'}}>
                  Solo puede haber una rifa activa a la vez.
                </p>
                <form onSubmit={handleCreateRaffle} className={styles.editForm}>
                  <input type="text" required placeholder="T&iacute;tulo (ej: MAZAL TIME)" value={newRaffleData.title} onChange={e => setNewRaffleData({...newRaffleData, title: e.target.value})} />
                  <input type="text" required placeholder="Nombre del Reloj" value={newRaffleData.watchName} onChange={e => setNewRaffleData({...newRaffleData, watchName: e.target.value})} />
                  <input type="text" placeholder="Detalles del reloj (ej: Full set, Brand new, 2025)" value={newRaffleData.watchDetails || ''} onChange={e => setNewRaffleData({...newRaffleData, watchDetails: e.target.value})} />
                  <input type="text" required placeholder="Signo Zodiacal" value={newRaffleData.zodiacSign} onChange={e => setNewRaffleData({...newRaffleData, zodiacSign: e.target.value})} />
                  <input type="date" required value={newRaffleData.drawDate} onChange={e => setNewRaffleData({...newRaffleData, drawDate: e.target.value})} />
                  <input type="number" required placeholder="Precio 1 Boleto (MXN)" value={newRaffleData.price1} onChange={e => setNewRaffleData({...newRaffleData, price1: parseInt(e.target.value)})} />
                  <input type="number" required placeholder="Precio 2+ Boletos (MXN)" value={newRaffleData.price2} onChange={e => setNewRaffleData({...newRaffleData, price2: parseInt(e.target.value)})} />
                  <input type="url" placeholder="Link sorteo Loter&iacute;a Nacional" value={newRaffleData.lotteryUrl || ''} onChange={e => setNewRaffleData({...newRaffleData, lotteryUrl: e.target.value})} />
                  <div className={styles.primaryImageUpload}>
                    <strong>Foto principal</strong>
                    <ImageUpload currentUrl={newRaffleData.imageUrl} onUploaded={url => setNewRaffleData({...newRaffleData, imageUrl: url})} />
                  </div>
                  {renderGalleryUploaders(newRaffleData, setNewRaffleData)}
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
              <input type="text" required placeholder="T&iacute;tulo" value={newRaffleData.title} onChange={e => setNewRaffleData({...newRaffleData, title: e.target.value})} />
              <input type="text" required placeholder="Nombre del Reloj" value={newRaffleData.watchName} onChange={e => setNewRaffleData({...newRaffleData, watchName: e.target.value})} />
              <input type="text" placeholder="Detalles del reloj (ej: Full set, Brand new, 2025)" value={newRaffleData.watchDetails || ''} onChange={e => setNewRaffleData({...newRaffleData, watchDetails: e.target.value})} />
              <input type="text" required placeholder="Signo Zodiacal" value={newRaffleData.zodiacSign} onChange={e => setNewRaffleData({...newRaffleData, zodiacSign: e.target.value})} />
              <input type="date" required value={newRaffleData.drawDate} onChange={e => setNewRaffleData({...newRaffleData, drawDate: e.target.value})} />
              <input type="number" required placeholder="Precio 1 Boleto" value={newRaffleData.price1} onChange={e => setNewRaffleData({...newRaffleData, price1: parseInt(e.target.value)})} />
              <input type="number" required placeholder="Precio 2+ Boletos" value={newRaffleData.price2} onChange={e => setNewRaffleData({...newRaffleData, price2: parseInt(e.target.value)})} />
              <input type="url" placeholder="Link sorteo Loter&iacute;a Nacional" value={newRaffleData.lotteryUrl || ''} onChange={e => setNewRaffleData({...newRaffleData, lotteryUrl: e.target.value})} />
              <div className={styles.primaryImageUpload}>
                <strong>Foto principal</strong>
                <ImageUpload currentUrl={newRaffleData.imageUrl} onUploaded={url => setNewRaffleData({...newRaffleData, imageUrl: url})} />
              </div>
              {renderGalleryUploaders(newRaffleData, setNewRaffleData)}
              <button type="submit" className={styles.saveBtn} style={{marginTop:'1rem'}}>Crear Rifa y Activar</button>
            </form>
          </div>
        </div>
      )}

      <section className={styles.pastRafflesSection}>
        <div className={styles.sectionHeader}>
          <h2>Rifas Pasadas</h2>
          <p>Edita la informaci&oacute;n que se muestra en ganadores anteriores o elimina una rifa archivada.</p>
        </div>

        {pastRaffleForms.length === 0 ? (
          <div className={styles.emptyState}>Todav&iacute;a no hay rifas pasadas.</div>
        ) : (
          <div className={styles.pastRafflesGrid}>
            {pastRaffleForms.map(pastRaffle => {
              const isEditing = editingPastRaffleId === pastRaffle.id;

              return (
                <div key={pastRaffle.id} className={styles.pastRaffleCard}>
                  {!isEditing ? (
                    <>
                      <div className={styles.pastRafflePreview}>
                        {pastRaffle.imageUrl ? (
                          <Image
                            src={pastRaffle.imageUrl}
                            alt={pastRaffle.watchName || 'Rifa pasada'}
                            width={180}
                            height={140}
                            unoptimized={pastRaffle.imageUrl.startsWith('http')}
                          />
                        ) : (
                          <div className={styles.pastRaffleNoImage}>Sin foto</div>
                        )}
                        <div>
                          <span className={styles.statusBadge}>Finalizada</span>
                          <h3>{pastRaffle.watchName || 'Rifa pasada'}</h3>
                          {pastRaffle.watchDetails && <p>{pastRaffle.watchDetails}</p>}
                          <small>{pastRaffle.title || 'Mazal Time'}</small>
                        </div>
                      </div>
                      <div className={styles.pastRaffleMeta}>
                        <span>Sorteo: {pastRaffle.drawDate || '-'}</span>
                        <span>Ganador: {pastRaffle.winningNumber !== '' ? String(pastRaffle.winningNumber).padStart(2, '0') : '-'}</span>
                      </div>
                      <button type="button" className={styles.saveBtn} onClick={() => setEditingPastRaffleId(pastRaffle.id)}>
                        Editar rifa pasada
                      </button>
                    </>
                  ) : (
                    <form
                      onSubmit={e => handleUpdatePastRaffle(e, pastRaffle)}
                      className={styles.pastRaffleEditForm}
                    >
                      <ImageUpload
                        currentUrl={pastRaffle.imageUrl}
                        onUploaded={url => updatePastRaffleForm(pastRaffle.id, { imageUrl: url })}
                      />
                      <input
                        type="text"
                        placeholder="T&iacute;tulo"
                        value={pastRaffle.title || ''}
                        onChange={e => updatePastRaffleForm(pastRaffle.id, { title: e.target.value })}
                      />
                      <input
                        type="text"
                        placeholder="Nombre del reloj"
                        value={pastRaffle.watchName || ''}
                        onChange={e => updatePastRaffleForm(pastRaffle.id, { watchName: e.target.value })}
                      />
                      <input
                        type="text"
                        placeholder="Detalles del reloj"
                        value={pastRaffle.watchDetails || ''}
                        onChange={e => updatePastRaffleForm(pastRaffle.id, { watchDetails: e.target.value })}
                      />
                      <input
                        type="text"
                        placeholder="Signo"
                        value={pastRaffle.zodiacSign || ''}
                        onChange={e => updatePastRaffleForm(pastRaffle.id, { zodiacSign: e.target.value })}
                      />
                      <input
                        type="url"
                        placeholder="Link sorteo Loter&iacute;a Nacional"
                        value={pastRaffle.lotteryUrl || ''}
                        onChange={e => updatePastRaffleForm(pastRaffle.id, { lotteryUrl: e.target.value })}
                      />
                      <input
                        type="date"
                        value={pastRaffle.drawDate || ''}
                        onChange={e => updatePastRaffleForm(pastRaffle.id, { drawDate: e.target.value })}
                      />
                      <div className={styles.inlineFields}>
                        <input
                          type="number"
                          min="0"
                          max="99"
                          placeholder="Ganador"
                          value={pastRaffle.winningNumber}
                          onChange={e => updatePastRaffleForm(pastRaffle.id, { winningNumber: e.target.value })}
                        />
                        <input
                          type="number"
                          placeholder="Precio 1"
                          value={pastRaffle.price1 || ''}
                          onChange={e => updatePastRaffleForm(pastRaffle.id, { price1: parseInt(e.target.value, 10) })}
                        />
                        <input
                          type="number"
                          placeholder="Precio 2+"
                          value={pastRaffle.price2 || ''}
                          onChange={e => updatePastRaffleForm(pastRaffle.id, { price2: parseInt(e.target.value, 10) })}
                        />
                      </div>
                      <div className={styles.pastRaffleActions}>
                        <button type="button" className={styles.liberateBtn} onClick={() => setEditingPastRaffleId(null)}>
                          Cancelar
                        </button>
                        <button type="submit" className={styles.saveBtn}>Guardar</button>
                        <button type="button" className={styles.endBtn} onClick={() => handleDeletePastRaffle(pastRaffle)}>
                          Eliminar
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
