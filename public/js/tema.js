(() => {
  const KEY = 'nodeejemplo-tema';
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  function temaGuardado() { const v = localStorage.getItem(KEY); return ['claro','oscuro','auto'].includes(v) ? v : 'auto'; }
  function aplicar() { const t = temaGuardado(); document.documentElement.dataset.tema = t === 'auto' ? (media.matches ? 'oscuro' : 'claro') : t; document.querySelectorAll('[data-selector-tema]').forEach(s => { s.value = t; }); }
  document.addEventListener('DOMContentLoaded', () => { aplicar(); document.querySelectorAll('[data-selector-tema]').forEach(s => s.addEventListener('change', () => { localStorage.setItem(KEY,s.value); aplicar(); })); });
  media.addEventListener('change', () => { if (temaGuardado() === 'auto') aplicar(); });
  aplicar();
})();
