export function createBoltBadge(): HTMLElement {
  const badge = document.createElement('div');
  badge.className = 'bolt-badge';
  
  badge.innerHTML = `
    <a href="https://bolt.new" target="_blank" rel="noopener noreferrer" class="bolt-badge-link">
      <img src="/black_circle_360x360.png" alt="Powered by Bolt" class="bolt-badge-image">
    </a>
  `;
  
  return badge;
}