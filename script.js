const navToggle = document.querySelector('.nav-toggle');
const siteNav = document.querySelector('.site-nav');
const cursorOrb = document.querySelector('.cursor-orb');
const heroVisual = document.querySelector('.hero-visual');
const interactiveTiles = document.querySelectorAll('.interactive-tile, .signal-card');

function setNavState(isOpen) {
  siteNav.classList.toggle('is-open', isOpen);
  navToggle.setAttribute('aria-expanded', String(isOpen));
}

navToggle?.addEventListener('click', () => {
  const isOpen = navToggle.getAttribute('aria-expanded') === 'true';
  setNavState(!isOpen);
});

siteNav?.addEventListener('click', (event) => {
  if (event.target instanceof HTMLAnchorElement && window.innerWidth <= 780) {
    setNavState(false);
  }
});

window.addEventListener('resize', () => {
  if (window.innerWidth > 780) {
    setNavState(false);
  }
});

window.addEventListener('pointermove', (event) => {
  const x = (event.clientX / window.innerWidth) * 100;
  const y = (event.clientY / window.innerHeight) * 100;

  document.documentElement.style.setProperty('--glow-x', `${x}%`);
  document.documentElement.style.setProperty('--glow-y', `${y}%`);

  if (cursorOrb) {
    cursorOrb.style.transform = `translate(${event.clientX - 120}px, ${event.clientY - 120}px)`;
  }

  if (heroVisual) {
    const rect = heroVisual.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const offsetX = (event.clientX - centerX) / 35;
    const offsetY = (event.clientY - centerY) / 35;
    heroVisual.style.setProperty('--card-x', `${offsetX}px`);
    heroVisual.style.setProperty('--card-y', `${offsetY}px`);
  }

  interactiveTiles.forEach((tile) => {
    const rect = tile.getBoundingClientRect();
    const dx = ((event.clientX - (rect.left + rect.width / 2)) / rect.width) * 10;
    const dy = ((event.clientY - (rect.top + rect.height / 2)) / rect.height) * 10;
    tile.style.transform = `perspective(900px) rotateX(${-dy}deg) rotateY(${dx}deg) translateY(-2px)`;
  });
});

window.addEventListener('pointerleave', () => {
  document.documentElement.style.setProperty('--glow-x', '50%');
  document.documentElement.style.setProperty('--glow-y', '20%');

  if (cursorOrb) {
    cursorOrb.style.transform = 'translate(-9999px, -9999px)';
  }

  if (heroVisual) {
    heroVisual.style.setProperty('--card-x', '0px');
    heroVisual.style.setProperty('--card-y', '0px');
  }

  interactiveTiles.forEach((tile) => {
    tile.style.transform = '';
  });
});
