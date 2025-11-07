// Small enhancements: scroll reveal and current year
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

const revealEls = document.querySelectorAll('.reveal');
const io = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('is-visible');
      io.unobserve(e.target);
    }
  });
}, { threshold: 0.14 });
revealEls.forEach(el => io.observe(el));

// Respect user color scheme in JS if needed later
const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
console.log('Dark mode?', prefersDark);
