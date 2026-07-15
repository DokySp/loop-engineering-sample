const navToggle = document.querySelector('.nav-toggle');
const siteNav = document.querySelector('.site-nav');

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
