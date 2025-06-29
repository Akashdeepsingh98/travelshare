export interface ButtonProps {
  text: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
  className?: string;
}

export function createButton(props: ButtonProps): HTMLButtonElement {
  const {
    text,
    onClick,
    variant = 'primary',
    size = 'medium',
    disabled = false,
    loading = false,
    icon,
    className = ''
  } = props;
  
  const button = document.createElement('button');
  button.className = `btn btn-${variant} btn-${size} ${className}`.trim();
  button.disabled = disabled || loading;
  
  const content = `
    ${loading ? `
      <span class="btn-loading">
        <span class="loading-dots">
          <span></span>
          <span></span>
          <span></span>
        </span>
      </span>
    ` : `
      ${icon ? `<span class="btn-icon">${icon}</span>` : ''}
      <span class="btn-text">${text}</span>
    `}
  `;
  
  button.innerHTML = content;
  button.addEventListener('click', onClick);
  
  return button;
}

export function createIconButton(icon: string, onClick: () => void, className: string = ''): HTMLButtonElement {
  const button = document.createElement('button');
  button.className = `icon-btn ${className}`.trim();
  button.innerHTML = icon;
  button.addEventListener('click', onClick);
  return button;
}