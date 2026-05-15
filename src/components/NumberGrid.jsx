'use client';
import { useState } from 'react';
import styles from './NumberGrid.module.css';

export default function NumberGrid({ tickets, onSelectNumber, labels = {} }) {
  const [selectedNumbers, setSelectedNumbers] = useState([]);

  const allTickets = tickets || Array.from({ length: 100 }).map((_, i) => ({
    number: i,
    status: 'AVAILABLE',
  }));

  const handleToggle = (num) => {
    const ticket = allTickets.find(t => t.number === num);
    if (!ticket || ticket.status === 'SOLD') return;

    let newSelection;
    if (selectedNumbers.includes(num)) {
      newSelection = selectedNumbers.filter(n => n !== num);
    } else {
      newSelection = [...selectedNumbers, num];
    }

    setSelectedNumbers(newSelection);
    if (onSelectNumber) {
      onSelectNumber(newSelection);
    }
  };

  return (
    <div className={styles.gridContainer}>
      <h2 className={styles.title}>{labels.chooseTicket || 'Boletos disponibles para la rifa'}</h2>
      <p className={styles.subtitle}>{labels.availableNumbers || 'Números disponibles'}</p>
      <div className={styles.statusLegend}>
        <div className={styles.legendItem}><div className={`${styles.dot} ${styles.available}`}></div> {labels.available || 'Disponible'}</div>
        <div className={styles.legendItem}><div className={`${styles.dot} ${styles.selected}`}></div> {labels.selected || 'Seleccionado'}</div>
        <div className={styles.legendItem}><div className={`${styles.dot} ${styles.sold}`}></div> {labels.unavailable || 'No disponible'}</div>
      </div>

      <div className={styles.grid}>
        {allTickets.map((ticket) => {
          const isSelected = selectedNumbers.includes(ticket.number);

          let statusClass = styles.available;
          if (ticket.status === 'SOLD') statusClass = styles.sold;
          else if (isSelected) statusClass = styles.selected;

          return (
            <button
              key={ticket.number}
              onClick={() => handleToggle(ticket.number)}
              disabled={ticket.status === 'SOLD'}
              className={`${styles.numberBtn} ${statusClass}`}
            >
              {ticket.number.toString().padStart(2, '0')}
            </button>
          );
        })}
      </div>
    </div>
  );
}
