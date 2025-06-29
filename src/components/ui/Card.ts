export interface CardProps {
  title?: string;
  content: HTMLElement | string;
  footer?: HTMLElement | string;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export function createCard(props: CardProps): HTMLElement {
  const {
    title,
    content,
    footer,
    className = '',
    onClick,
    hoverable = false
  } = props;
  
  const card = document.createElement('div');
  card.className = `card ${hoverable ? 'card-hoverable' : ''} ${className}`.trim();
  
  if (onClick) {
    card.style.cursor = 'pointer';
    card.addEventListener('click', onClick);
  }
  
  let cardHTML = '';
  
  if (title) {
    cardHTML += `
      <div class="card-header">
        <h3 class="card-title">${title}</h3>
      </div>
    `;
  }
  
  cardHTML += '<div class="card-body"></div>';
  
  if (footer) {
    cardHTML += '<div class="card-footer"></div>';
  }
  
  card.innerHTML = cardHTML;
  
  // Insert content
  const cardBody = card.querySelector('.card-body') as HTMLElement;
  if (typeof content === 'string') {
    cardBody.innerHTML = content;
  } else {
    cardBody.appendChild(content);
  }
  
  // Insert footer
  if (footer) {
    const cardFooter = card.querySelector('.card-footer') as HTMLElement;
    if (typeof footer === 'string') {
      cardFooter.innerHTML = footer;
    } else {
      cardFooter.appendChild(footer);
    }
  }
  
  return card;
}

export function createMiniAppCard(app: any, onLaunch: (appId: string) => void): HTMLElement {
  const categoryIcons = {
    transportation: '🚗',
    food: '🍽️',
    shopping: '🛍️',
    entertainment: '🎬',
    travel: '✈️',
    business: '💼',
    other: '📋'
  };
  
  const defaultIcon = categoryIcons[app.category] || '📱';
  
  const cardContent = document.createElement('div');
  cardContent.innerHTML = `
    <div class="mini-app-icon">
      ${app.icon_url ? `<img src="${app.icon_url}" alt="${app.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">` : ''}
      <span class="app-icon-fallback" ${app.icon_url ? 'style="display: none;"' : ''}>${defaultIcon}</span>
    </div>
    <div class="mini-app-info">
      <h4 class="mini-app-name">${app.name}</h4>
      <p class="mini-app-description">${app.description || 'No description'}</p>
      <span class="mini-app-category">${app.category}</span>
    </div>
  `;
  
  const launchButton = document.createElement('button');
  launchButton.className = 'mini-app-launch';
  launchButton.innerHTML = `
    <span class="launch-icon">🚀</span>
    Launch
  `;
  launchButton.addEventListener('click', (e) => {
    e.stopPropagation();
    onLaunch(app.id);
  });
  
  return createCard({
    content: cardContent,
    footer: launchButton,
    className: 'mini-app-card',
    hoverable: true
  });
}