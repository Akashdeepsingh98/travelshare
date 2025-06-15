export interface ModalProps {
  title: string;
  content: HTMLElement | string;
  onClose: () => void;
  size?: 'small' | 'medium' | 'large' | 'fullscreen';
  showCloseButton?: boolean;
  className?: string;
}

export function createModal(props: ModalProps): HTMLElement {
  const {
    title,
    content,
    onClose,
    size = 'medium',
    showCloseButton = true,
    className = ''
  } = props;
  
  const modal = document.createElement('div');
  modal.className = `modal modal-${size} ${className}`.trim();
  
  modal.innerHTML = `
    <div class="modal-backdrop"></div>
    <div class="modal-container">
      <div class="modal-header">
        <h2 class="modal-title">${title}</h2>
        ${showCloseButton ? '<button class="modal-close">✕</button>' : ''}
      </div>
      <div class="modal-body">
        <!-- Content will be inserted here -->
      </div>
    </div>
  `;
  
  // Insert content
  const modalBody = modal.querySelector('.modal-body') as HTMLElement;
  if (typeof content === 'string') {
    modalBody.innerHTML = content;
  } else {
    modalBody.appendChild(content);
  }
  
  // Event listeners
  const backdrop = modal.querySelector('.modal-backdrop') as HTMLElement;
  const closeBtn = modal.querySelector('.modal-close') as HTMLButtonElement;
  
  backdrop.addEventListener('click', onClose);
  closeBtn?.addEventListener('click', onClose);
  
  // Close on escape key
  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };
  
  document.addEventListener('keydown', handleKeyPress);
  
  // Cleanup function
  modal.addEventListener('remove', () => {
    document.removeEventListener('keydown', handleKeyPress);
  });
  
  return modal;
}

export function showModal(modal: HTMLElement): void {
  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';
  
  // Trigger animation
  requestAnimationFrame(() => {
    modal.classList.add('active');
  });
}

export function hideModal(modal: HTMLElement): void {
  modal.classList.remove('active');
  document.body.style.overflow = '';
  
  // Remove from DOM after animation
  setTimeout(() => {
    if (modal.parentNode) {
      modal.parentNode.removeChild(modal);
    }
  }, 300);
}