// Se ejecuta antes de pintar la página para evitar el parpadeo del tema
(function () {
    var t;
    try { t = localStorage.getItem('tema'); } catch (e) {}
    if (t !== 'claro' && t !== 'oscuro') t = window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'oscuro' : 'claro';
    document.documentElement.dataset.tema = t;
})();
