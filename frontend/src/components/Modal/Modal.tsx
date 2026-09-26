'use client';

import { X } from 'lucide-react';
import { useEffect } from 'react';
import { useIconSize } from '@/i18n/useTranslation';
import styles from './Modal.module.css';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const iconSize = useIconSize();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose} role="presentation">
      <div
        className={styles.modalContent}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className={styles.header}>
          <h2 className={styles.title} id="modal-title">{title}</h2>
          <button className={styles.closeButton} onClick={onClose} aria-label="Close">
            <X size={iconSize.lg} />
          </button>
        </div>
        <div className={styles.body}>
          {children}
        </div>
      </div>
    </div>
  );
}
