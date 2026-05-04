'use client';
import { useState } from 'react';
import styles from './NumberGrid.module.css';

export default function NumberGrid({ tickets, onSelectNumber }) {
  const [selectedNumbers, setSelectedNumbers] = useState([]);

  // Tickets should be an array of length 100 with status. If not provided, we mock it.
  const allTickets = tickets || Array.from({ length: 100 }).map((_, i) => ({
    number: i,
    status: 'AVAILABLE'
  }));

  const handleToggle = (num) => {
    const ticket = allTickets.find(t => t.number === num);
    if (!ticket || ticket.status !== 'AVAILABLE') return;

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
      <h3 className={styles.title}>Elige tus números</h3>
      <div className={styles.statusLegend}>
        <div className={styles.legendItem}><div className={`${styles.dot} ${styles.available}`}></div> Disponible</div>
        <div className={styles.legendItem}><div className={`${styles.dot} ${styles.selected}`}></div> Seleccionado</div>
        <div className={styles.legendItem}><div className={`${styles.dot} ${styles.sold}`}></div> Ocupado</div>
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
              disabled={ticket.status !== 'AVAILABLE'}
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
